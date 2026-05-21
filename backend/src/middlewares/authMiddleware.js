const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check for active session version using Prisma
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: 'User no longer exists' });
    
    // Log previous devices out if version does not match
    if (decoded.jwtVersion !== undefined && user.jwtVersion !== decoded.jwtVersion) {
      return res.status(401).json({ error: 'Session expired (logged in on another device)' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Export both names for backward compatibility
module.exports = { protect, authMiddleware: protect };
