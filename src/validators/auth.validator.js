import { body } from "express-validator";

export const signupValidator = [
    body("userName")
        .trim()
        .toLowerCase()
        .isLength({ min: 3, max: 20 })
        .withMessage("Username must be between 3 to 20 characters long")
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage("Username can only contain letters, numbers, and underscores"),

    body("email")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),

    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long")
];

export const loginValidator = [
    body("email")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
];

export const otpValidator = [
    body("email")
        .isEmail()
        .withMessage("Invalid email"),

    body("otp")
        .isLength({ min: 6, max: 6 })
        .withMessage("OTP must be exactly 6 digits")
        .matches(/^[0-9]+$/)
        .withMessage("OTP must be numeric")
];

export const emailValidator = [
    body("email")
        .isEmail()
        .withMessage("Invalid email")
];

export const resetPasswordValidator = [
    body("email")
        .isEmail()
        .withMessage("Valid email is required"),

    body("otp")
        .isLength({ min: 6, max: 6 })
        .withMessage("OTP must be 6 digits")
        .matches(/^[0-9]+$/)
        .withMessage("OTP must be numeric"),

    body("newPassword")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long")
];
