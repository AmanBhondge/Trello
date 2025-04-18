import User from "../models/user.model.js";
import cloudinary from "../utils/cloudinary.js";

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash -otp -otpExpiresAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
    try {
      const updates = {};
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      if (req.body.userName) {
        updates.userName = req.body.userName;
      }
  
      if (req.file) {
        if (user.profilePicId) {
          await cloudinary.uploader.destroy(user.profilePicId);
        }
  
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "profile_pics",
        });
  
        updates.profilePic = result.secure_url;
        updates.profilePicId = result.public_id;
      }
  
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-passwordHash -otp -otpExpiresAt");
  
      res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };