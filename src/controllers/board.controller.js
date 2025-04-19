import mongoose from 'mongoose';
import Board from '../models/board.model.js';
import User from '../models/user.model.js';

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
      // Validate boardId and memberId
      if (!mongoose.Types.ObjectId.isValid(boardId) || !mongoose.Types.ObjectId.isValid(memberId)) {
        return res.status(400).json({ message: 'Invalid boardId or memberId' });
      }
  
      // Find the board by ID
      const board = await Board.findById(boardId);
      if (!board) {
        return res.status(404).json({ message: 'Board not found' });
      }
  
      // Check if the board is private
      if (board.visibility === 'private') {
        return res.status(403).json({ message: 'Cannot add members to a private board' });
      }
  
      // Check if the requester is the creator of the board
      if (board.createdBy.toString() !== requesterId) {
        return res.status(403).json({ message: 'Only the board creator can add members' });
      }
  
      // Add member to the board using $addToSet to prevent duplicates
      const updatedBoard = await Board.findByIdAndUpdate(
        boardId,
        { $addToSet: { members: memberId } },
        { new: true }
      );
  
      // Populate member details
      const newMember = await User.findById(memberId).select('_id name email');
  
      // Emit real-time update to the board's chat room
      if (updatedBoard.chatRoomId) {
        req.io.to(updatedBoard.chatRoomId.toString()).emit('memberAdded', {
          boardId: updatedBoard._id,
          member: newMember,
        });
      }
  
      res.status(200).json({ message: 'Member added successfully', member: newMember });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
};