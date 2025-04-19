import express from "express";
import { getProfile, updateProfile } from "../controllers/user.controller.js";
import { validateUpdateProfile } from "../validators/user.validator.js";
import validate from "../middlewares/validate.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import cloudinaryUpload from "../middlewares/cloudinaryUpload.middleware.js";

const userRouter = express.Router();

userRouter.get("/profile", authorize, getProfile);

userRouter.patch(
    "/update",
    authorize,
    cloudinaryUpload.single("profilePic"),
    validateUpdateProfile,
    validate,
    updateProfile
);

export default userRouter;
