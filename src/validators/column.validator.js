import { body } from "express-validator";

export const createColumnValidation = [
    body("boardId").notEmpty().withMessage("Board ID is required"),
    body("title").notEmpty().withMessage("Title is required")
];

export const updateColumnValidation = [
    body("title").optional().notEmpty().withMessage("Title can't be empty"),
    body("position").optional().isNumeric().withMessage("Position must be a number")
];
