import mongoose from 'mongoose';
import Board from '../models/board.model.js';
import User from '../models/user.model.js';
import { sendInviteEmail } from "../utils/sendOTP.js";

export const getMyBoards = async (req, res) => {
  try {
    const boards = await Board.find({ createdBy: req.user.userId }).select('_id title');
    res.status(200).json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllBoards = async (req, res) => {
  try {
    const userId = req.user.userId;
    const boards = await Board.find({
      $or: [
        { createdBy: userId },
        { members: userId }
      ]
    }).select('_id title');
    res.status(200).json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createBoard = async (req, res) => {
  const { title, description, visibility, members } = req.body;
  const createdBy = req.user.userId;

  try {
    const newBoard = new Board({
      title,
      description,
      visibility,
      createdBy,
      members,
      admins: [createdBy],
    });

    const savedBoard = await newBoard.save();
    res.status(201).json(savedBoard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateBoardTitle = async (req, res) => {
  const { title } = req.body;
  const boardId = req.params.id;

  try {
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    board.title = title;
    const updatedBoard = await board.save();

    req.io.to(updatedBoard._id.toString()).emit("boardTitleUpdated", {
      boardId: updatedBoard._id,
      newTitle: updatedBoard.title,
    });

    res.status(200).json(updatedBoard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addMemberToBoard = async (req, res) => {
  const { boardId } = req.params;
  const { memberId } = req.body;
  const requesterId = req.user.userId;

  try {
    if (!mongoose.Types.ObjectId.isValid(boardId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: 'Invalid boardId or memberId' });
    }

    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (board.visibility === 'private') {
      return res.status(403).json({ message: 'Cannot add members to a private board' });
    }

    if (board.createdBy.toString() !== requesterId.toString()) {
      return res.status(403).json({ message: 'Only the board creator can add members' });
    }

    if (memberId === requesterId) {
      return res.status(400).json({ message: 'You are the board creator and cannot add yourself as a member' });
    }

    const isAlreadyMember = board.members.some(member => member.toString() === memberId);
    if (isAlreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this board' });
    }

    const updatedBoard = await Board.findByIdAndUpdate(
      boardId,
      { $addToSet: { members: memberId } },
      { new: true }
    );

    const newMember = await User.findById(memberId).select('_id userName email');
    const inviter = await User.findById(requesterId).select('userName');

    if (req.io) {
      req.io.to(updatedBoard._id.toString()).emit('memberAdded', {
        boardId: updatedBoard._id,
        member: newMember,
      });
    }

    await sendInviteEmail(newMember.email, board.title, inviter.userName);

    res.status(200).json({
      message: 'Member added successfully',
      member: newMember,
    });
  } catch (error) {
    console.error('Error adding member to board:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getBoardMembers = async (req, res) => {
  const { boardId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return res.status(400).json({ message: "Invalid board ID" });
  }

  try {
    const board = await Board.findById(boardId).populate({
      path: "members",
      select: "_id userName email profilePic",
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    res.status(200).json({ members: board.members });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};