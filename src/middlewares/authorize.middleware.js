import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config.js';
import User from '../models/user.model.js';

const authorize = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.email !== decoded.email) {
      return res.status(401).json({ message: 'Token information mismatch' });
    }

    req.user = {
      userId: user._id,
      email: user.email
    };
    next();

  } catch (error) {
    res.status(401).json({ message: 'Unauthorized', error: error.message });
  }
};

export default authorize;