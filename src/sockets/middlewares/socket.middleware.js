import jwt from "jsonwebtoken";
import User from "../../models/user.model.js";
import { JWT_SECRET } from "../../config/config.js";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return next(new Error("Authentication error"));

    socket.user = {
      userId: user._id.toString(),
      name: user.name,
      userName: user.userName || user.name
    };
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
};
