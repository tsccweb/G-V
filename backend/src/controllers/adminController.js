const prisma = require('../utils/prisma');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        plan: true,
        planExpiresAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('[AdminController] getAllUsers Error:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
};

// Update user role or plan
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { role, plan, firstName, lastName } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { role, plan, firstName, lastName },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, plan: true }
    });
    res.json(updated);
  } catch (error) {
    console.error('[AdminController] updateUser Error:', error);
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('[AdminController] deleteUser Error:', error);
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
};

// Get all subscription requests
exports.getSubscriptionRequests = async (req, res) => {
  try {
    const requests = await prisma.subscriptionRequest.findMany({
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    console.error('[AdminController] getSubscriptionRequests Error:', error);
    res.status(500).json({ error: 'Failed to fetch requests', details: error.message });
  }
};

// Approve or reject request
exports.handleSubscriptionRequest = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // APPROVED or REJECTED

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const request = await prisma.subscriptionRequest.update({
      where: { id },
      data: { status },
      include: { user: true }
    });

    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: request.userId },
        data: { 
          plan: request.plan,
          planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    }

    res.json({ message: `Request ${status.toLowerCase()}`, request });
  } catch (error) {
    console.error('[AdminController] handleSubscriptionRequest Error:', error);
    res.status(500).json({ error: 'Failed to handle request', details: error.message });
  }
};
