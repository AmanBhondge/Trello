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
      methods: ["GET", "POST", "PUT", "PATCH"]
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
        name: user.name
      };
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const { userId } = socket.user;
    onlineUsers.set(userId, socket.id);
    console.log(`User connected: ${userId}`);

    try {
      const boards = await Board.find({
        $or: [{ members: userId }, { createdBy: userId }]
      }).select("_id");

      boards.forEach((board) => {
        socket.join(board._id.toString());
      });
    } catch (err) {
      console.error("Error joining user to boards:", err);
    }

    socket.on("joinBoard", (boardId) => {
      socket.join(boardId);
    });

    socket.on("sendMessage", ({ roomId, message }) => {
      io.to(roomId).emit("newMessage", {
        message,
        sender: userId,
        timestamp: new Date()
      });
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      console.log(`User disconnected: ${userId}`);
    });
  });
};

export { initSocket, onlineUsers, io };
