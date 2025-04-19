import Column from "../models/column.model.js";
import Board from "../models/board.model.js";
import { io } from "../sockets/socket.js";
import Task from '../models/task.model.js';
import Comment from '../models/comment.model.js';

export const createColumn = async (req, res) => {
  try {
    const { boardId, title } = req.body;

    // Find the board and populate its columns
    const board = await Board.findById(boardId).populate('columns');
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Determine the new position
    const newPosition = board.columns.length > 0
      ? Math.max(...board.columns.map(col => col.position)) + 1
      : 1;

    // Create the new column with the determined position
    const column = new Column({ boardId, title, position: newPosition });
    const savedColumn = await column.save();

    // Update the board to include the new column
    board.columns.push(savedColumn._id);
    await board.save();

    // Emit the column creation event
    io.to(boardId).emit('columnCreated', savedColumn);

    res.status(201).json(savedColumn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    const { title } = req.body;

    const updatedColumn = await Column.findByIdAndUpdate(
      columnId,
      { title },
      { new: true }
    );

    if (!updatedColumn) return res.status(404).json({ error: "Column not found" });

    io.to(updatedColumn.boardId.toString()).emit("columnUpdated", updatedColumn);

    res.status(200).json(updatedColumn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getColumnsWithTasksAndComments = async (req, res) => {
  try {
    const { boardId } = req.params;

    // Find columns for the specific board and populate tasks and comments
    const columns = await Column.find({ boardId })
      .populate({
        path: 'taskId',
        select: 'title description assigne tags dueDate',
        populate: {
          path: 'comments',
          select: 'content createdAt',
          populate: {
            path: 'userId',
            select: 'name email',
          },
        },
      })
      .exec();

    if (!columns) {
      return res.status(404).json({ message: 'No columns found for this board' });
    }

    res.status(200).json(columns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};