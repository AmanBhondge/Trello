import Task from "../models/task.model.js";
import Column from "../models/column.model.js";
import mongoose from "mongoose";

export const getTasksByColumn = async (req, res) => {
    const { columnId } = req.params;

    try {
        const tasks = await Task.find({ columnId }).sort("position");
        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ message: "Error fetching tasks", error: error.message });
    }
};

export const createTask = async (req, res) => {
    try {
      const { columnId, title, description, tags, dueDate, attachments } = req.body;
      const assigne = req.user.userId;
  
      const column = await Column.findById(columnId);
      if (!column) {
        return res.status(404).json({ message: "Column not found" });
      }
  
      const taskCount = await Task.countDocuments({ columnId });
  
      const newTask = new Task({
        columnId,
        title,
        description,
        assigne,
        tags,
        dueDate,
        attachments,
        position: taskCount + 1,
      });
  
      await newTask.save();
  
      const updatedColumn = await Column.findByIdAndUpdate(
        columnId,
        { $push: { tasks: newTask._id } }, 
        { new: true }
      );
  
      console.log("Task added to column:", updatedColumn);
  
      res.status(201).json({ message: "Task created successfully", task: newTask });
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Error creating task", error: error.message });
    }
  };
  

export const updateTask = async (req, res) => {
    const { taskId } = req.params;
    const { columnId, position } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: "Invalid task ID" });
        }

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });

        const oldColumnId = task.columnId.toString();
        const oldPosition = task.position;
        const newColumnId = columnId || oldColumnId;

        if (columnId && columnId !== oldColumnId) {
            await Task.updateMany(
                { columnId: oldColumnId, position: { $gt: oldPosition } },
                { $inc: { position: -1 } }
            );

            await Task.updateMany(
                { columnId: newColumnId, position: { $gte: position } },
                { $inc: { position: 1 } }
            );
        }

        else if (position && position !== oldPosition) {
            const direction = position > oldPosition ? -1 : 1;
            const rangeQuery = position > oldPosition
                ? { $gt: oldPosition, $lte: position }
                : { $gte: position, $lt: oldPosition };

            await Task.updateMany(
                { columnId: oldColumnId, position: rangeQuery },
                { $inc: { position: direction } }
            );
        }

        const updatedTask = await Task.findByIdAndUpdate(taskId, req.body, {
            new: true,
        });

        res.status(200).json({ message: "Task updated successfully", task: updatedTask });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Error updating task", error: error.message });
    }
};