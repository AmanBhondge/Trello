import { body } from "express-validator";

export const validateUpdateProfile = [
  body("userName")
    .optional()
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 to 20 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
];
