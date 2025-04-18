import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/config.js";

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "24h",
  });
};