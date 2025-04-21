import { body, param } from "express-validator";

export const createTaskValidation = [
    body("columnId", "Column ID is required").isMongoId(),
    body("title", "Title is required").notEmpty(),
    body("assigne", "Assignee is required").isMongoId()
];

export const updateTaskValidation = [
    param("taskId", "Invalid task ID").isMongoId(),
    body("title").optional().notEmpty(),
    body("description").optional().isString(),
    body("assigne").optional().isMongoId(),
    body("tags").optional().isArray(),
    body("dueDate").optional().isISO8601(),
    body("attachments").optional().isArray(),
    body("position").optional().isNumeric()
];

export const getTasksByColumnValidation = [
    param("columnId", "Invalid column ID").isMongoId()
];
