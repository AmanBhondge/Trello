import { Server } from "socket.io";
import { socketAuthMiddleware } from "./middlewares/socket.middleware.js";
import { handleBoardEvents } from "./handlers/board.handler.js";
import { handleColumnEvents } from "./handlers/column.handler.js";
import { handleTaskEvents } from "./handlers/task.handler.js";
import { handleCommentEvents } from "./handlers/comment.handler.js";
import { handleConnection } from "./handlers/connection.handler.js";

const onlineUsers = new Map();
let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "https://trello-sigma-pearl.vercel.app",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const { userId, userName } = socket.user;
    onlineUsers.set(userId, socket.id);

    handleBoardEvents(io, socket, onlineUsers);
    handleColumnEvents(io, socket);
    handleTaskEvents(io, socket);
    handleCommentEvents(io, socket);
    handleConnection(io, socket, onlineUsers);
  });
};

export { initSocket, onlineUsers, io };