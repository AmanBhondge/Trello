import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config.js';

export const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, JWT_SECRET, {
    expiresIn: '24h',
  });
};
