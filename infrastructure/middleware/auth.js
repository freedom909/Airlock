// File: infrastructure/auth/auth.js
import jwt from 'jsonwebtoken';
import User from '../../services/models/user.js'


// Middleware to check if the user is authenticated and set the user in the request context
export const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Middleware to check if the user has permission to view listings
export const checkPermissions = async (req, res, next) => {
  const { userId } = req.params;
  const user = await User.findOne({ where: { id: req.user.id } });

  if (!user || (user.id !== parseInt(userId) && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
