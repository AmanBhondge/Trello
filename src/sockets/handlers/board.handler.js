export const handleBoardEvents = (io, socket, onlineUsers) => {
  const { userId, userName } = socket.user;

  socket.on("joinBoard", (boardId) => {
    socket.join(boardId);
    socket.to(boardId).emit("userActive", { userId, userName, boardId, timestamp: new Date() });
  });

  socket.on("leaveBoard", (boardId) => {
    socket.leave(boardId);
    socket.to(boardId).emit("userLeft", { userId, userName, boardId, timestamp: new Date() });
  });

  socket.on("boardContentUpdate", ({ boardId, content, lastModified }) => {
    socket.to(boardId).emit("boardContentUpdated", {
      boardId,
      content,
      lastModified,
      updatedBy: { userId, userName }
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
};