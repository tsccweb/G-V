const prisma = require('../utils/prisma');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.warn('[AuthMiddleware] No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check for active session version using Prisma
    let user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      console.warn(`[AuthMiddleware] User not found: ${decoded.userId}`);
      return res.status(401).json({ error: 'User no longer exists' });
    }
    
    // Check if subscription has expired
    if (user.plan !== 'FREE' && user.planExpiresAt && user.planExpiresAt < new Date()) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { plan: 'FREE' }
      });
      decoded.plan = 'FREE'; // Override current request permissons
    }

    // Log previous devices out if version does not match
    if (decoded.jwtVersion !== undefined && user.jwtVersion !== decoded.jwtVersion) {
      console.warn(`[AuthMiddleware] Session version mismatch for user ${user.id}. Token: ${decoded.jwtVersion}, DB: ${user.jwtVersion}`);
      return res.status(401).json({ error: 'Session expired (logged in on another device)' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Token verification failed:', error.message);
    res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

// Export both names for backward compatibility
module.exports = { protect, authMiddleware: protect };
