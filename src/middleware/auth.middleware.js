import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// Middleware to authenticate user using JWT
export const authenticate = async (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;
    // Check if header exists and starts with 'Bearer '
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
    // Extract token from header
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication token missing' });
    // Verify token and decode payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Find user in database by decoded userId
    const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { id: true, email: true, role: true } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    // Handle invalid or expired token
    if (error instanceof jwt.JsonWebTokenError) return res.status(401).json({ error: 'Invalid or expired token' });
    next(error);
  }
};

// Middleware to authorize admin users only
export const authorizeAdmin = (req, res, next) => {
  // Check if user exists and has 'ADMIN' role
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden: Admin access required' });
  next();
};