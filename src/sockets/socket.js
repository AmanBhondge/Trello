import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/config.js";
import User from "../models/user.model.js";
import Board from "../models/board.model.js";

const onlineUsers = new Map();
let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) return next(new Error("Authentication error"));

      socket.user = {
        userId: user._id.toString(),
        name: user.name,
        userName: user.userName || user.name
      };
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const { userId, userName } = socket.user;
    onlineUsers.set(userId, socket.id);
    console.log(`User connected: ${userId} (${userName})`);

    try {
      const boards = await Board.find({
        $or: [{ members: userId }, { createdBy: userId }]
      }).select("_id");

      boards.forEach((board) => {
        const boardId = board._id.toString();
        socket.join(boardId);
        console.log(`User ${userId} joined board room: ${boardId}`);

        socket.to(boardId).emit("userOnline", {
          userId,
          userName,
          timestamp: new Date()
        });
      });

      socket.emit("boardsJoined", {
        boardIds: boards.map(board => board._id.toString()),
        timestamp: new Date()
      });
    } catch (err) {
      console.error("Error joining user to boards:", err);
    }

    socket.on("joinBoard", (boardId) => {
      socket.join(boardId);
      console.log(`User ${userId} manually joined board: ${boardId}`);

      socket.to(boardId).emit("userActive", {
        userId,
        userName,
        boardId,
        timestamp: new Date()
      });
    });

    socket.on("boardContentUpdate", ({ boardId, content, lastModified }) => {
      socket.to(boardId).emit("boardContentUpdated", {
        boardId,
        content,
        lastModified,
        updatedBy: {
          userId,
          userName
        }
      });
    });

    socket.on("cursorMove", ({ boardId, position, selection }) => {
      socket.to(boardId).emit("userCursorMoved", {
        userId,
        userName,
        position,
        selection,
        timestamp: new Date()
      });
    });

    socket.on("taskUpdate", (data) => {
      const { boardId, taskId, updates } = data;
      socket.to(boardId).emit("taskUpdated", {
        boardId,
        taskId,
        updates,
        updatedBy: {
          userId,
          userName
        },
        timestamp: new Date()
      });
    });

    socket.on("columnUpdate", (data) => {
      const { boardId, columnId, updates } = data;
      socket.to(boardId).emit("columnUpdated", {
        boardId,
        columnId,
        updates,
        updatedBy: {
          userId,
          userName
        },
        timestamp: new Date()
      });
    });

    socket.on("taskMove", (data) => {
      const { boardId, taskId, sourceColumnId, destinationColumnId, newIndex } = data;
      socket.to(boardId).emit("taskMoved", {
        boardId,
        taskId,
        sourceColumnId,
        destinationColumnId,
        newIndex,
        movedBy: {
          userId,
          userName
        },
        timestamp: new Date()
      });
    });

    socket.on("columnReorder", (data) => {
      const { boardId, columnOrder } = data;
      socket.to(boardId).emit("columnsReordered", {
        boardId,
        columnOrder,
        reorderedBy: {
          userId,
          userName
        },
        timestamp: new Date()
      });
    });

    socket.on("userTyping", ({ boardId, taskId }) => {
      socket.to(boardId).emit("userIsTyping", {
        userId,
        userName,
        boardId,
        taskId,
        timestamp: new Date()
      });
    });

    socket.on("userStoppedTyping", ({ boardId, taskId }) => {
      socket.to(boardId).emit("userStoppedTyping", {
        userId,
        boardId,
        taskId
      });
    });

    socket.on("addComment", (data) => {
      const { boardId, taskId, comment } = data;
      socket.to(boardId).emit("commentAdded", {
        boardId,
        taskId,
        comment,
        author: {
          userId,
          userName
        },
        timestamp: new Date()
      });
    });

    socket.on("leaveBoard", (boardId) => {
      socket.leave(boardId);
      socket.to(boardId).emit("userLeft", {
        userId,
        userName,
        boardId,
        timestamp: new Date()
      });
      console.log(`User ${userId} left board: ${boardId}`);
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      console.log(`User disconnected: ${userId} (${userName})`);

      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          io.to(room).emit("userOffline", {
            userId,
            userName,
            timestamp: new Date()
          });
        }
      });
    });
  });
};

export { initSocket, onlineUsers, io };