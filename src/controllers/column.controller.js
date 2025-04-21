import Column from "../models/column.model.js";
import Board from "../models/board.model.js";
import { io } from "../sockets/socket.js";
import Task from '../models/task.model.js';
import Comment from '../models/comment.model.js';

export const createColumn = async (req, res) => {
  try {
    const { boardId, title } = req.body;

    const board = await Board.findById(boardId).populate('columns');
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const newPosition = board.columns.length > 0
      ? Math.max(...board.columns.map(col => col.position)) + 1
      : 1;

    const column = new Column({ boardId, title, position: newPosition });
    const savedColumn = await column.save();

    board.columns.push(savedColumn._id);
    await board.save();

    io.to(boardId).emit('columnCreated', savedColumn);

    res.status(201).json(savedColumn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const moveColumn = async (req, res) => {
  try {
    const { boardId, columnId, newPosition } = req.body;

    const columnToMove = await Column.findById(columnId);
    if (!columnToMove) {
      return res.status(404).json({ message: 'Column not found' });
    }

    const currentPosition = columnToMove.position;

    if (currentPosition === newPosition) {
      return res.status(200).json({ message: 'Column already at the desired position' });
    }

    if (currentPosition < newPosition) {
      await Column.updateMany(
        {
          boardId,
          position: { $gt: currentPosition, $lte: newPosition },
        },
        { $inc: { position: -1 } }
      );
    } else {
      await Column.updateMany(
        {
          boardId,
          position: { $gte: newPosition, $lt: currentPosition },
        },
        { $inc: { position: 1 } }
      );
    }

    columnToMove.position = newPosition;
    await columnToMove.save();

    io.to(boardId).emit('columnMoved', {
      columnId,
      newPosition,
    });

    res.status(200).json({ message: 'Column moved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateColumnTitle = async (req, res) => {
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