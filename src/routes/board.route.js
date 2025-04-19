import express from 'express';
import validate  from '../middlewares/validate.middleware.js'
import { createBoardValidation, updateBoardTitleValidation } from '../validators/board.validator.js';
import { createBoard, updateBoardTitle } from '../controllers/board.controller.js';

const boardRouter = express.Router();



boardRouter.post(
    '/create',
    createBoardValidation,
    validate,
    createBoard
);

boardRouter.put(
    '/update/:id/title',
    updateBoardTitleValidation,
    validate,
    updateBoardTitle
);

export default boardRouter;
