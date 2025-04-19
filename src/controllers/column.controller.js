import Column from "../models/column.model.js";
import Board from "../models/board.model.js";
import { io } from "../sockets/socket.js";

export const createColumn = async (req, res) => {
  try {
    const { boardId, title, position } = req.body;

    const column = new Column({ boardId, title, position });
    const savedColumn = await column.save();

    await Board.findByIdAndUpdate(boardId, {
      $push: { columns: savedColumn._id }
    });

    io.to(boardId).emit("columnCreated", savedColumn);

    res.status(201).json(savedColumn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    const { title, position } = req.body;

    const updatedColumn = await Column.findByIdAndUpdate(
      columnId,
      { title, position },
      { new: true }
    );

    if (!updatedColumn) return res.status(404).json({ error: "Column not found" });

    io.to(updatedColumn.boardId.toString()).emit("columnUpdated", updatedColumn);

    res.status(200).json(updatedColumn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
