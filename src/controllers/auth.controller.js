import bcrypt from "bcryptjs";
import zxcvbn from "zxcvbn";
import User from "../models/user.model.js";
import cloudinary from "../utils/cloudinary.js";
import { sendOTP } from "../utils/sendOTP.js";
import { generateToken } from "../utils/tokenGenerator.js";

export const signup = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email is already registered" });

    const strength = zxcvbn(password);
    if (strength.score < 3) {
      return res.status(400).json({ message: "Weak password. Try again." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let profilePic = "";
    let profilePicId = "";

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_pics",
      });
      profilePic = uploadResult.secure_url;
      profilePicId = uploadResult.public_id;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 1 * 60 * 1000);

    const newUser = new User({
      userName,
      email,
      passwordHash,
      profilePic,
      profilePicId,
      otp,
      otpExpiresAt: otpExpiry,
      isVerified: false,
      lastOtpSentAt: new Date(),
    });

    await newUser.save();
    await sendOTP(email, otp);

    res.status(201).json({ message: "Signup successful. OTP sent to email." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    const now = Date.now();
    const lastSent = user.lastOtpSentAt ? user.lastOtpSentAt.getTime() : 0;

    if (now - lastSent < 60 * 1000) {
      const waitTime = Math.ceil((60 * 1000 - (now - lastSent)) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitTime} more second(s) before requesting a new OTP.`,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(now + 1 * 60 * 1000);

    user.otp = otp;
    user.otpExpiresAt = otpExpiry;
    user.lastOtpSentAt = new Date();
    await user.save();

    await sendOTP(email, otp);

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resendOtpForPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = Date.now();
    const lastSent = user.lastOtpSentAt ? user.lastOtpSentAt.getTime() : 0;

    if (now - lastSent < 60 * 1000) {
      const waitTime = Math.ceil((60 * 1000 - (now - lastSent)) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitTime} more second(s) before requesting a new OTP.`,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(now + 1 * 60 * 1000);

    user.otp = otp;
    user.otpExpiresAt = otpExpiry;
    user.lastOtpSentAt = new Date();
    await user.save();

    await sendOTPToResetPassword(email, otp);

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) return res.status(400).json({ message: "User already verified" });
    if (user.otp !== otp || user.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.status(200).json({ message: "User verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });
    if (!user.isVerified) {
      return res.status(401).json({ message: "Email not verified. Please verify your account." });
    }

    const token = generateToken(user._id, user.email);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 1 * 60 * 1000);

    user.otp = otp;
    user.otpExpiresAt = otpExpiry;
    user.lastOtpSentAt = new Date();
    await user.save();

    await sendOTP(email, otp);

    res.status(200).json({ message: "OTP sent to your email for password reset." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp || user.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const strength = zxcvbn(newPassword);
    if (strength.score < 3) {
      return res.status(400).json({ message: "Weak password. Try again." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
