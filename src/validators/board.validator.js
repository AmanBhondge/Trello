import { body } from 'express-validator';

export const createBoardValidation = [
    body('title').notEmpty().withMessage('Title is required'),
    body('visibility').isIn(['workspace', 'private']).withMessage('Visibility must be workspace or private'),
];

export const updateBoardTitleValidation = [
    body('title').isString().notEmpty().withMessage('Title must be a non-empty string'),
];