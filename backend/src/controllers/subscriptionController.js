const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.updatePlan = async (req, res) => {
  const { plan } = req.body;
  const validPlans = ['FREE', 'STANDARD'];
  
  if (!validPlans.includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  try {
    // If user is downgrading to FREE, do it immediately
    if (plan === 'FREE') {
      const user = await prisma.user.update({
        where: { id: req.user.userId },
        data: { plan, planExpiresAt: null },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, plan: true }
      });
      return res.json(user);
    }

    // Check if there's already a pending request
    const pending = await prisma.subscriptionRequest.findFirst({
      where: { userId: req.user.userId, status: 'PENDING' }
    });

    if (pending) {
      if (pending.plan === plan) {
        return res.status(400).json({ error: 'You already have a pending request for this plan' });
      } else {
        // Update existing pending request
        const updatedReq = await prisma.subscriptionRequest.update({
          where: { id: pending.id },
          data: { plan }
        });
        return res.json({ message: 'Pending request updated', request: updatedReq });
      }
    }

    // Create new request
    const request = await prisma.subscriptionRequest.create({
      data: {
        userId: req.user.userId,
        plan
      }
    });

    res.json({ message: 'Subscription request submitted for approval', request });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process subscription update' });
  }
};

exports.getPlan = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { plan: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
};

exports.getPendingRequest = async (req, res) => {
  try {
    const request = await prisma.subscriptionRequest.findFirst({
      where: { userId: req.user.userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(request || null);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending request' });
  }
};
