const prismaClient = require('../utils/prisma');

const adminMiddleware = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prismaClient.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true }
    });

    if (user && user.role === 'ADMIN') {
      next();
    } else {
      res.status(403).json({ error: 'Access denied: Admin only' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error in admin middleware' });
  }
};

module.exports = { adminMiddleware };
