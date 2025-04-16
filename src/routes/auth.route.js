import express from "express";
import validate from "../middlewares/validate.middleware.js";
import { signup, login } from "../controllers/auth.controller.js";
import { signupValidation, loginValidation } from "../validators/auth.validator.js";
import upload from "../middlewares/upload.middleware.js";

const authRouter = express.Router();

authRouter.post("/signup", upload.single("profilePic"), signupValidation, validate, signup);
authRouter.post("/login", loginValidation, validate, login);

export default authRouter;
