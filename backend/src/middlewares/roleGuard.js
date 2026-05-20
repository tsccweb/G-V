/**
 * Role-based access control middleware.
 * Usage: router.post('/admin-only', protect, roleGuard('ADMIN'), handler)
 *        router.post('/leaders', protect, roleGuard('ADMIN', 'PASTOR', 'WORSHIP_LEADER'), handler)
 */
const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: `This action requires one of: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = { roleGuard };
