const prisma = require('../utils/prisma');

// Get combined unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // 1. General Notifications
    const notificationCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    // 2. Team Invitations (Pending Lineups)
    const invitationCount = await prisma.lineup.count({
      where: { userId, status: 'PENDING' }
    });

    let adminCount = 0;
    // 3. Admin: Subscription Requests
    if (userRole === 'ADMIN') {
      adminCount = await prisma.subscriptionRequest.count({
        where: { status: 'PENDING' }
      });
    }

    const total = notificationCount + invitationCount + adminCount;

    res.json({
      total,
      notifications: notificationCount,
      invitations: invitationCount,
      adminRequests: adminCount
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

// Get all notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // 1. General Notifications
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // 2. Pending Invitations (from Lineup)
    const invitations = await prisma.lineup.findMany({
      where: { userId, status: 'PENDING' },
      include: { service: { select: { title: true } } },
      orderBy: { id: 'desc' } // Lineup doesn't have createdAt, using id as proxy for order
    });

    // 3. Admin: Subscription Requests
    let adminRequests = [];
    if (userRole === 'ADMIN') {
      adminRequests = await prisma.subscriptionRequest.findMany({
        where: { status: 'PENDING' },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Map all to a consistent format
    const mappedInvitations = invitations.map(inv => ({
      id: inv.id,
      message: `Team Invitation: You've been invited to join the lineup for "${inv.service.title}".`,
      createdAt: new Date(), // Lineup doesn't have createdAt, using current date for UI
      isRead: false,
      type: 'INVITATION'
    }));

    const mappedAdminRequests = adminRequests.map(req => ({
      id: req.id,
      message: `Admin: New subscription upgrade request from ${req.user.firstName} ${req.user.lastName}.`,
      createdAt: req.createdAt,
      isRead: false,
      type: 'ADMIN_REQUEST'
    }));

    const all = [
      ...notifications,
      ...mappedInvitations,
      ...mappedAdminRequests
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(all.slice(0, 50));
  } catch (error) {
    console.error('Error fetching unified notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.notification.update({
      where: { id, userId: req.user.userId },
      data: { isRead: true }
    });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};
