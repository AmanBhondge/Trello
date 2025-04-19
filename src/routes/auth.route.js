import express from 'express';
import { signup, verifyOtp, login, resendOtp, forgotPassword, resetPassword, resendOtpForPasswordReset } from '../controllers/auth.controller.js';
import validate from '../middlewares/validate.middleware.js';
import { signupValidator, loginValidator, otpValidator, emailValidator, resetPasswordValidator } from '../validators/auth.validator.js';
import upload from "../middlewares/upload.middleware.js";

const authRouter = express.Router();

authRouter.post('/signup', upload.single("profilePic"), signupValidator, validate, signup);
authRouter.post('/resend-otp', emailValidator, validate, resendOtp);
authRouter.post('/resend-otp-reset', emailValidator, validate, resendOtpForPasswordReset);
authRouter.post('/verify-otp', otpValidator, validate, verifyOtp);
authRouter.post('/login', loginValidator, validate, login);
authRouter.post('/forgot-password', emailValidator, validate, forgotPassword);
authRouter.post('/reset-password', resetPasswordValidator, validate, resetPassword);

export default authRouter;
