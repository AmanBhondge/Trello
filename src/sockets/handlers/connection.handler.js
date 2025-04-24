import Board from "../../models/board.model.js";

export const handleConnection = async (socket, io, onlineUsers) => {
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
      socket.to(boardId).emit("userOnline", { userId, userName, timestamp: new Date() });
    });

    socket.emit("boardsJoined", {
      boardIds: boards.map(board => board._id.toString()),
      timestamp: new Date()
    });
  } catch (err) {
    console.error("Error joining user to boards:", err);
  }

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
};
