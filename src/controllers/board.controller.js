import Board from '../models/board.model.js';

export const createBoard = async (req, res) => {
    const { title, description, visibility, members } = req.body;
    const createdBy = req.user.userId; 

    try {
        const newBoard = new Board({
            title,
            description,
            visibility,
            createdBy,
            members,
            admins: [createdBy], 
        });

        const savedBoard = await newBoard.save();
        res.status(201).json(savedBoard);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateBoardTitle = async (req, res) => {
    const { title } = req.body;
    const boardId = req.params.id;

    try {
        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }

        board.title = title;
        const updatedBoard = await board.save();
        res.status(200).json(updatedBoard);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
