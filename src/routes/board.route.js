import express from 'express';
import validate from '../middlewares/validate.middleware.js'
import { createBoardValidation, updateBoardTitleValidation } from '../validators/board.validator.js';
import { createBoard, updateBoardTitle, getMyBoards, getAllBoards } from '../controllers/board.controller.js';
import authorize from '../middlewares/authorize.middleware.js';

const boardRouter = express.Router();

boardRouter.get('/my-boards', authorize, getMyBoards);

boardRouter.get('/all-boards', authorize, getAllBoards);

boardRouter.post(
    '/create',
    authorize,
    createBoardValidation,
    validate,
    createBoard
);

boardRouter.put(
    '/update/:id/title',
    authorize,
    updateBoardTitleValidation,
    validate,
    updateBoardTitle
);

export default boardRouter;
