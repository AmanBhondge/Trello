import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [20, "Username cannot exceed 20 characters"],
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Invalid email format"],
    },

    passwordHash: {
      type: String,
      required: true,
    },

    profilePicId: {
      type: String,
    },

    profilePic: {
      type: String,
      default: "",
    },

    boards: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Board",
      },
    ],

    isOnline: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    lastOtpSentAt: {
      type: Date,
      default: null
    },
    otp: String,
    otpExpiresAt: Date
  },

  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
