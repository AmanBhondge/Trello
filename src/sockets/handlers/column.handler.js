export const handleColumnEvents = (socket, io) => {
    const { userId, userName } = socket.user;
  
    socket.on("columnCreate", ({ boardId, column }) => {
      socket.to(boardId).emit("columnCreated", {
        boardId, column,
        createdBy: { userId, userName },
        timestamp: new Date()
      });
    });
  
    socket.on("columnUpdate", ({ boardId, columnId, updates }) => {
      socket.to(boardId).emit("columnUpdated", {
        boardId, columnId, updates,
        updatedBy: { userId, userName },
        timestamp: new Date()
      });
    });
  
    socket.on("columnDelete", ({ boardId, columnId }) => {
      socket.to(boardId).emit("columnDeleted", {
        boardId, columnId,
        deletedBy: { userId, userName },
        timestamp: new Date()
      });
    });
  
    socket.on("columnReorder", ({ boardId, columnOrder }) => {
      socket.to(boardId).emit("columnsReordered", {
        boardId, columnOrder,
        reorderedBy: { userId, userName },
        timestamp: new Date()
      });
    });
  
    socket.on("columnMove", ({ boardId, columnId, oldPosition, newPosition }) => {
      socket.to(boardId).emit("columnMoved", {
        boardId, columnId,
        oldPosition, newPosition,
        movedBy: { userId, userName },
        timestamp: new Date()
      });
    });
  };
  