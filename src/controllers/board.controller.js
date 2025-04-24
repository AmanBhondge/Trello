import mongoose from 'mongoose';
import Board from '../models/board.model.js';
import User from '../models/user.model.js';
import { sendInviteEmail } from "../utils/sendOTP.js";

export const getMyBoards = async (req, res) => {
  try {
    const boards = await Board.find({ createdBy: req.user.userId }).select('_id title visibility description');
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
    })
      .select('_id title visibility description createdBy')
      .populate({
        path: 'createdBy',
        select: 'userName email -_id'
      });

    res.status(200).json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createBoard = async (req, res) => {
  const { title, description, visibility, members } = req.body;
  const createdBy = req.user.userId;

  try {
    // Ensure creator is also a member
    const membersList = Array.isArray(members) ? [...new Set([...members, createdBy])] : [createdBy];
    
    const newBoard = new Board({
      title,
      description,
      visibility,
      createdBy,
      members: membersList,
      admins: [createdBy],
    });

    const savedBoard = await newBoard.save();
    
    // Get creator info for notification
    const creator = await User.findById(createdBy).select('userName');
    
    // Notify all members about the new board
    membersList.forEach(memberId => {
      if (req.io) {
        req.io.to(memberId.toString()).emit('boardCreated', {
          board: {
            _id: savedBoard._id,
            title: savedBoard.title,
            description: savedBoard.description,
            visibility: savedBoard.visibility,
            createdBy: {
              _id: createdBy,
              userName: creator.userName
            }
          },
          timestamp: new Date()
        });
      }
    });

    res.status(201).json(savedBoard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateBoardTitle = async (req, res) => {
  const { title, description, visibility } = req.body;
  const boardId = req.params.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({ error: 'Invalid board ID' });
    }

    const board = await Board.findById(boardId).select('createdBy title description visibility members');

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (!board.createdBy.equals(req.user.userId)) {
      return res.status(403).json({ error: 'Only the board creator can update the board' });
    }

    if (title !== undefined) board.title = title;
    if (description !== undefined) board.description = description;
    if (visibility !== undefined) board.visibility = visibility;

    const updatedBoard = await board.save();

    const user = await User.findById(req.user.userId).select('userName');

    req.io.to(updatedBoard._id.toString()).emit("boardUpdated", {
      boardId: updatedBoard._id,
      title: updatedBoard.title,
      description: updatedBoard.description,
      visibility: updatedBoard.visibility,
      updatedBy: {
        userId: req.user.userId,
        userName: user.userName
      },
      timestamp: new Date()
    });

    res.status(200).json(updatedBoard);
  } catch (err) {
    console.error("Error updating board:", err);
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
    if (memberId.toString() === board.createdBy.toString()) {
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

    req.io.to(updatedBoard._id.toString()).emit('memberAdded', {
      boardId: updatedBoard._id,
      member: newMember,
      addedBy: {
        userId: requesterId,
        userName: inviter.userName
      },
      timestamp: new Date()
    });

    req.io.to(memberId.toString()).emit('addedToBoard', {
      boardId: updatedBoard._id,
      boardTitle: updatedBoard.title,
      addedBy: {
        userId: requesterId,
        userName: inviter.userName
      },
      timestamp: new Date()
    });

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

export const removeMember = async (req, res) => {
  const { boardId, memberId } = req.params;
  const requesterId = req.user.userId;

  try {
    if (!mongoose.Types.ObjectId.isValid(boardId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: 'Invalid boardId or memberId' });
    }

    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (board.createdBy.toString() !== requesterId.toString() && 
        !board.admins.some(admin => admin.toString() === requesterId.toString())) {
      return res.status(403).json({ message: 'You do not have permission to remove members' });
    }

    if (memberId.toString() === board.createdBy.toString()) {
      return res.status(400).json({ message: 'Cannot remove the board creator' });
    }

    const updatedBoard = await Board.findByIdAndUpdate(
      boardId,
      {
        $pull: {
          members: memberId,
          admins: memberId
        }
      },
      { new: true }
    );

    const member = await User.findById(memberId).select('userName');
    const requester = await User.findById(requesterId).select('userName');

    req.io.to(boardId).emit('memberRemoved', {
      boardId,
      removedMember: {
        userId: memberId,
        userName: member.userName
      },
      removedBy: {
        userId: requesterId,
        userName: requester.userName
      },
      timestamp: new Date()
    });
    
    req.io.to(memberId.toString()).emit('removedFromBoard', {
      boardId,
      boardTitle: board.title,
      removedBy: {
        userId: requesterId,
        userName: requester.userName
      },
      timestamp: new Date()
    });

    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const makeAdmin = async (req, res) => {
  const { boardId, memberId } = req.params;
  const requesterId = req.user.userId;

  try {
    if (!mongoose.Types.ObjectId.isValid(boardId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: 'Invalid boardId or memberId' });
    }

    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (board.createdBy.toString() !== requesterId.toString()) {
      return res.status(403).json({ message: 'Only the board creator can assign admin privileges' });
    }

    if (!board.members.some(member => member.toString() === memberId)) {
      return res.status(400).json({ message: 'User must be a board member to be made admin' });
    }

    if (board.admins.some(admin => admin.toString() === memberId)) {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    const updatedBoard = await Board.findByIdAndUpdate(
      boardId,
      { $addToSet: { admins: memberId } },
      { new: true }
    );

    // Get user info for notifications
    const newAdmin = await User.findById(memberId).select('userName');
    const requester = await User.findById(requesterId).select('userName');

    // Notify all board members
    req.io.to(boardId).emit('adminAdded', {
      boardId,
      newAdmin: {
        userId: memberId,
        userName: newAdmin.userName
      },
      addedBy: {
        userId: requesterId,
        userName: requester.userName
      },
      timestamp: new Date()
    });

    res.status(200).json({ message: 'Admin privileges granted successfully' });
  } catch (error) {
    console.error('Error making admin:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const removeAdmin = async (req, res) => {
  const { boardId, adminId } = req.params;
  const requesterId = req.user.userId;

  try {
    if (!mongoose.Types.ObjectId.isValid(boardId) || !mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ message: 'Invalid boardId or adminId' });
    }

    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (board.createdBy.toString() !== requesterId.toString()) {
      return res.status(403).json({ message: 'Only the board creator can remove admin privileges' });
    }

    if (adminId.toString() === board.createdBy.toString()) {
      return res.status(400).json({ message: 'Cannot remove admin status from board creator' });
    }

    const updatedBoard = await Board.findByIdAndUpdate(
      boardId,
      { $pull: { admins: adminId } },
      { new: true }
    );

    const formerAdmin = await User.findById(adminId).select('userName');
    const requester = await User.findById(requesterId).select('userName');

    req.io.to(boardId).emit('adminRemoved', {
      boardId,
      formerAdmin: {
        userId: adminId,
        userName: formerAdmin.userName
      },
      removedBy: {
        userId: requesterId,
        userName: requester.userName
      },
      timestamp: new Date()
    });

    res.status(200).json({ message: 'Admin privileges removed successfully' });
  } catch (error) {
    console.error('Error removing admin:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteBoard = async (req, res) => {
  const { boardId } = req.params;
  const requesterId = req.user.userId;

  try {
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({ message: 'Invalid boardId' });
    }

    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (board.createdBy.toString() !== requesterId.toString()) {
      return res.status(403).json({ message: 'Only the board creator can delete the board' });
    }

    const members = [...board.members].map(member => member.toString());
    
    await Board.findByIdAndDelete(boardId);

    const requester = await User.findById(requesterId).select('userName');

    members.forEach(memberId => {
      req.io.to(memberId).emit('boardDeleted', {
        boardId,
        boardTitle: board.title,
        deletedBy: {
          userId: requesterId,
          userName: requester.userName
        },
        timestamp: new Date()
      });
    });

    res.status(200).json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Error deleting board:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};