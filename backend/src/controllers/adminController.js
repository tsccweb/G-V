const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
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
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
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
    res.status(500).json({ error: 'Failed to fetch requests' });
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
        data: { plan: request.plan }
      });
    }

    res.json({ message: `Request ${status.toLowerCase()}`, request });
  } catch (error) {
    res.status(500).json({ error: 'Failed to handle request' });
  }
};
