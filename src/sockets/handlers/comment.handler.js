export const handleCommentEvents = (socket, io) => {
    const { userId, userName } = socket.user;
  
    socket.on("addComment", ({ boardId, taskId, comment }) => {
      socket.to(boardId).emit("commentAdded", {
        boardId, taskId, comment,
        author: { userId, userName },
        timestamp: new Date()
      });
    });
  
    socket.on("userTyping", ({ boardId, taskId }) => {
      socket.to(boardId).emit("userIsTyping", {
        userId, userName, boardId, taskId,
        timestamp: new Date()
      });
    });
  
    socket.on("userStoppedTyping", ({ boardId, taskId }) => {
      socket.to(boardId).emit("userStoppedTyping", {
        userId, boardId, taskId
      });
    });
  };
  