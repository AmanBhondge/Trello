import express from "express";
import { getMe, updateProfile, uploadProfilePic } from "../controllers/user.controller.js";
import { validateUpdateProfile } from "../validators/user.validator.js";
import validate from "../middlewares/validate.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import cloudinaryUpload from "../middlewares/cloudinaryUpload.middleware.js";

const router = express.Router();



router.get("/me", authorize, getMe);
router.patch("/me", authorize, validateUpdateProfile, validate, updateProfile);
router.post("/me/profile-pic", authorize, cloudinaryUpload.single("profilePic"), uploadProfilePic);

export default router;
