import Task from "../models/task.model.js";
import Column from "../models/column.model.js";
import Board from "../models/board.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import { io } from "../sockets/socket.js";

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
        
        const column = await Column.findByIdAndUpdate(
            columnId,
            { $push: { taskId: newTask._id } },
            { new: true }
        );
        
        // Get the boardId from the column to emit socket event
        const boardId = column.boardId.toString();
        
        // Get user information for the socket event
        const user = await User.findById(assigne).select('name userName');
        
        // Emit event to all users in the board room
        io.to(boardId).emit('taskCreated', {
            task: newTask,
            columnId,
            boardId,
            createdBy: {
                userId: assigne,
                userName: user.userName || user.name
            },
            timestamp: new Date()
        });
        
        res.status(201).json({ message: "Task created successfully", task: newTask });
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Error creating task", error: error.message });
    }
};

export const updateTask = async (req, res) => {
    const { taskId } = req.params;
    const { columnId: newColumnId, position: newPosition, ...updateFields } = req.body;
    const userId = req.user.userId;

    try {
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: "Invalid task ID" });
        }
        
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });
        
        const oldColumnId = task.columnId.toString();
        const oldPosition = task.position;
        const isColumnChanged = newColumnId && newColumnId !== oldColumnId;
        
        if (isColumnChanged) {
            await Task.updateMany(
                { columnId: oldColumnId, position: { $gt: oldPosition } },
                { $inc: { position: -1 } }
            );
            
            await Task.updateMany(
                { columnId: newColumnId, position: { $gte: newPosition } },
                { $inc: { position: 1 } }
            );
            
            await Column.findByIdAndUpdate(oldColumnId, {
                $pull: { taskId: taskId },
            });
            
            await Column.findByIdAndUpdate(newColumnId, {
                $push: {
                    taskId: {
                        $each: [taskId],
                        $position: newPosition,
                    },
                },
            });
            
            task.columnId = newColumnId;
            task.position = newPosition;
        }
        
        else if (newPosition !== undefined && newPosition !== oldPosition) {
            const direction = newPosition > oldPosition ? -1 : 1;
            const rangeQuery = newPosition > oldPosition
                ? { $gt: oldPosition, $lte: newPosition }
                : { $gte: newPosition, $lt: oldPosition };
            
            await Task.updateMany(
                { columnId: oldColumnId, position: rangeQuery },
                { $inc: { position: direction } }
            );
            
            const column = await Column.findById(oldColumnId);
            if (column) {
                column.taskId.pull(taskId);
                column.taskId.splice(newPosition, 0, taskId);
                await column.save();
            }
            
            task.position = newPosition;
        }
        
        Object.assign(task, updateFields);
        await task.save();
        
        // Get user information for the socket event
        const user = await User.findById(userId).select('name userName');
        
        // Find the board ID (needed for socket room)
        let boardId;
        if (isColumnChanged) {
            const newColumn = await Column.findById(newColumnId);
            boardId = newColumn.boardId.toString();
        } else {
            const column = await Column.findById(oldColumnId);
            boardId = column.boardId.toString();
        }
        
        // Emit appropriate event based on the type of update
        if (isColumnChanged) {
            io.to(boardId).emit('taskMoved', {
                taskId,
                task: task,
                sourceColumnId: oldColumnId,
                destinationColumnId: newColumnId,
                oldPosition,
                newPosition,
                movedBy: {
                    userId,
                    userName: user.userName || user.name
                },
                timestamp: new Date()
            });
        } else if (newPosition !== undefined && newPosition !== oldPosition) {
            io.to(boardId).emit('taskReordered', {
                taskId,
                task: task,
                columnId: oldColumnId,
                oldPosition,
                newPosition,
                reorderedBy: {
                    userId,
                    userName: user.userName || user.name
                },
                timestamp: new Date()
            });
        } else {
            io.to(boardId).emit('taskUpdated', {
                taskId,
                task: task,
                updates: updateFields,
                updatedBy: {
                    userId,
                    userName: user.userName || user.name
                },
                timestamp: new Date()
            });
        }
        
        res.status(200).json({ message: "Task updated successfully", task });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Error updating task", error: error.message });
    }
};

export const deleteTask = async (req, res) => {
    const { taskId } = req.params;
    const userId = req.user.userId;

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });
        
        const columnId = task.columnId;
        const position = task.position;
        
        // Remove the task from the column
        await Column.findByIdAndUpdate(columnId, {
            $pull: { taskId: taskId }
        });
        
        // Update positions of remaining tasks
        await Task.updateMany(
            { columnId, position: { $gt: position } },
            { $inc: { position: -1 } }
        );
        
        // Delete the task
        await Task.findByIdAndDelete(taskId);
        
        // Get column to find the board
        const column = await Column.findById(columnId);
        const boardId = column.boardId.toString();
        
        // Get user information for the socket event
        const user = await User.findById(userId).select('name userName');
        
        // Emit event to all users in the board room
        io.to(boardId).emit('taskDeleted', {
            taskId,
            columnId,
            boardId,
            deletedBy: {
                userId,
                userName: user.userName || user.name
            },
            timestamp: new Date()
        });
        
        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Error deleting task", error: error.message });
    }
};

export const addComment = async (req, res) => {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });
        
        const comment = {
            content,
            userId,
            createdAt: new Date()
        };
        
        task.comments.push(comment);
        await task.save();
        
        // Get column to find the board
        const column = await Column.findById(task.columnId);
        const boardId = column.boardId.toString();
        
        // Get user information for the socket event
        const user = await User.findById(userId).select('name userName');
        
        // Emit event to all users in the board room
        io.to(boardId).emit('commentAdded', {
            taskId,
            comment,
            boardId,
            columnId: task.columnId.toString(),
            author: {
                userId,
                userName: user.userName || user.name
            },
            timestamp: new Date()
        });
        
        res.status(201).json({ message: "Comment added successfully", comment });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Error adding comment", error: error.message });
    }
};