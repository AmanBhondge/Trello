export const handleTaskEvents = (socket, io) => {
    const { userId, userName } = socket.user;
  
    socket.on("taskCreate", ({ boardId, columnId, task }) => {
      socket.to(boardId).emit("taskCreated", {
        boardId, columnId, task,
        createdBy: { userId, userName },
        timestamp: new Date()
      });
    });
  
    socket.on("taskUpdate", ({ boardId, taskId, updates }) => {
      socket.to(boardId).emit("taskUpdated", {
        boardId, taskId, updates,
        updatedBy: { userId, userName },
        timestamp: new Date()
      });
    });
  
    socket.on("taskDelete", ({ boardId, taskId, columnId }) => {
      socket.to(boardId).emit("taskDeleted", {
        boardId, taskId, columnId,
        deletedBy: { userId, userName },
        timestamp: new Date()
      });
    });
  
    socket.on("taskMove", ({ boardId, taskId, sourceColumnId, destinationColumnId, oldPosition, newPosition }) => {
      socket.to(boardId).emit("taskMoved", {
        boardId, taskId, sourceColumnId, destinationColumnId,
        oldPosition, newPosition,
        movedBy: { userId, userName },
        timestamp: new Date()
      });
    });
  
    socket.on("taskReorder", ({ boardId, taskId, columnId, oldPosition, newPosition }) => {
      socket.to(boardId).emit("taskReordered", {
        boardId, taskId, columnId,
        oldPosition, newPosition,
        reorderedBy: { userId, userName },
        timestamp: new Date()
      });
    });
  };
  