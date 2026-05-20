const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// Generate a 6-digit session code
const generateCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Create Service
exports.createService = async (req, res) => {
  const { date, title, notes, items } = req.body;
  try {
    const service = await prisma.service.create({
      data: {
        date: new Date(date),
        title,
        notes,
        userId: req.user.userId,
        items: {
          create: (items || []).map((item, index) => ({
            title: item.title,
            type: item.type,
            assignedTo: item.assignedTo,
            notes: item.notes,
            duration: parseInt(item.duration) || 0,
            order: index
          }))
        }
      },
      include: { items: true, lineup: true }
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create service' });
  }
};

// Get All Services
exports.getServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: {
        OR: [
          { userId: req.user.userId },
          { lineup: { some: { userId: req.user.userId } } }
        ]
      },
      include: { lineup: true },
      orderBy: { date: 'asc' }
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

// Get Service by ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await prisma.service.findFirst({
      where: { 
        id: req.params.id,
        OR: [
          { userId: req.user.userId },
          { lineup: { some: { userId: req.user.userId } } }
        ]
      },
      include: { 
        items: { 
          include: { song: true },
          orderBy: { order: 'asc' } 
        },
        lineup: { include: { user: { select: { firstName: true, lastName: true, role: true } } } },
        liveSession: true
      }
    });
    
    if (!service) return res.status(404).json({ error: 'Service not found' });

    // Auto-link fallback: If an item has songId null, try to find a song with the same title
    const enrichedItems = await Promise.all(service.items.map(async (item) => {
      if (!item.song && item.type === 'SONG') {
        const foundSong = await prisma.song.findFirst({
          where: { 
            title: { equals: item.title, mode: 'insensitive' },
            userId: service.userId // Match against the service creator's library
          }
        });
        return { ...item, song: foundSong };
      }
      return item;
    }));

    // Enrich lineup with virtual name
    const enrichedLineup = (service.lineup || []).map(member => ({
      ...member,
      user: member.user ? {
        ...member.user,
        name: `${member.user.firstName} ${member.user.lastName}`
      } : null
    }));

    res.json({ ...service, items: enrichedItems, lineup: enrichedLineup });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update Service Items (Drag & Drop Sync)
exports.updateServiceItems = async (req, res) => {
  const { items } = req.body; // Array of { id, order }
  try {
    // Check if user owns the service containing these items
    const service = await prisma.service.findFirst({
        where: { id: req.params.id, userId: req.user.userId }
    });
    if (!service) return res.status(403).json({ error: 'Only the creator can edit this service' });

    const updates = items.map(item => 
      prisma.serviceItem.update({
        where: { 
          id: item.id,
          service: { userId: req.user.userId } // Must be creator to reorder
        },
        data: { order: item.order }
      })
    );
    await Promise.all(updates);
    res.json({ message: 'Service flow updated' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update service flow' });
  }
};

// Add Service Item
exports.addServiceItem = async (req, res) => {
  const { serviceId } = req.params;
  const { title, type, assignedTo, notes, duration, order, songId } = req.body;
  try {
    // Verify service ownership
    const service = await prisma.service.findFirst({
      where: { id: serviceId, userId: req.user.userId }
    });
    if (!service) return res.status(403).json({ error: 'Only the creator can add items' });

    const item = await prisma.serviceItem.create({
      data: {
        serviceId,
        title,
        type: type || 'SONG',
        assignedTo,
        notes,
        duration: duration || 0,
        order: order || 99,
        songId
      },
      include: { song: true }
    });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to add item to flow' });
  }
};

// Remove Service Item
exports.removeServiceItem = async (req, res) => {
  const { serviceId, itemId } = req.params;
  try {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, userId: req.user.userId }
    });
    if (!service) return res.status(403).json({ error: 'Only the creator can remove items' });

    await prisma.serviceItem.delete({
      where: { id: itemId }
    });
    res.json({ message: 'Item removed from worship flow' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to remove item' });
  }
};

// Delete Entire Service
exports.deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    const service = await prisma.service.findFirst({
      where: { id, userId: req.user.userId }
    });
    if (!service) return res.status(403).json({ error: 'Only the creator can delete this service' });

    await prisma.service.delete({
      where: { id }
    });
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to delete service' });
  }
};

// Add Team Member to Lineup
exports.addToLineup = async (req, res) => {
  const { serviceId, userId, email, role } = req.body;
  try {
    // Verify service ownership
    const service = await prisma.service.findFirst({
      where: { id: serviceId, userId: req.user.userId }
    });
    if (!service) return res.status(403).json({ error: 'Only the creator can assign roles' });

    let memberId = userId;
    if (!memberId && email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      memberId = user.id;
    }
    if (!memberId) return res.status(400).json({ error: 'User id or email is required' });

    const existing = await prisma.lineup.findFirst({
      where: { serviceId, userId: memberId }
    });
    if (existing) return res.status(409).json({ error: 'User already invited or on the team' });

    const lineup = await prisma.lineup.create({
      data: {
        serviceId,
        userId: memberId,
        role: role || 'MEMBER',
        status: 'PENDING'
      },
      include: { user: { select: { firstName: true, lastName: true } } }
    });

    res.status(201).json(lineup);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to add to lineup' });
  }
};

// Remove Team Member from Lineup
exports.removeFromLineup = async (req, res) => {
  const { serviceId, id } = req.params;
  try {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, userId: req.user.userId }
    });
    if (!service) return res.status(403).json({ error: 'Only the creator can remove team members' });

    await prisma.lineup.delete({
      where: { id }
    });
    res.json({ message: 'Member removed from lineup' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to remove from lineup' });
  }
};

// Get My Pending Invitations
exports.getMyInvitations = async (req, res) => {
  try {
    const invitations = await prisma.lineup.findMany({
      where: { userId: req.user.userId, status: 'PENDING' },
      include: {
        service: { select: { title: true, createdBy: { select: { firstName: true, lastName: true } } } }
      }
    });

    const formatted = invitations.map(inv => ({
      id: inv.id,
      serviceTitle: inv.service.title,
      role: inv.role,
      sender: inv.service.createdBy ? `${inv.service.createdBy.firstName} ${inv.service.createdBy.lastName}` : 'Admin',
      status: inv.status
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
};

// Respond To Invitation
exports.respondToInvitation = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'ACCEPTED' or 'DECLINED'
  try {
    const inv = await prisma.lineup.updateMany({
      where: { 
        id: id,
        userId: req.user.userId 
      },
      data: { status }
    });
    if (inv.count === 0) return res.status(404).json({ error: 'Invitation not found' });
    res.json({ message: `Invitation ${status.toLowerCase()}` });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update invitation status' });
  }
};

// Get My Team (Distinct users involved in services)
exports.getMyTeam = async (req, res) => {
  try {
    // For privacy, "My Team" consists of users who are in services created by me
    // OR users who have invited me to services.
    const myServices = await prisma.service.findMany({
      where: { userId: req.user.userId },
      include: { lineup: { include: { user: true } } }
    });

    const servicesIJoined = await prisma.lineup.findMany({
      where: { userId: req.user.userId },
      include: { service: { include: { createdBy: true, lineup: { include: { user: true } } } } }
    });

    const teammates = new Map();

    myServices.forEach(s => {
      s.lineup.forEach(l => {
        if (l.user && l.user.id !== req.user.userId) {
          teammates.set(l.user.id, l.user);
        }
      });
    });

    servicesIJoined.forEach(l => {
      if (l.service.createdBy && l.service.createdBy.id !== req.user.userId) {
        teammates.set(l.service.createdBy.id, l.service.createdBy);
      }
      l.service.lineup.forEach(member => {
        if (member.user && member.user.id !== req.user.userId) {
          teammates.set(member.user.id, member.user);
        }
      });
    });

    const formatted = Array.from(teammates.values()).map(u => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      role: u.role,
      status: 'Active'
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
};

// Go Live — create or reset a live session for this service
exports.goLiveService = async (req, res) => {
  const { id } = req.params;
  try {
    // Verify service ownership
    const service = await prisma.service.findFirst({
      where: { id, userId: req.user.userId }
    });
    if (!service) return res.status(403).json({ error: 'Unauthorized' });

    const newCode = generateCode();

    const session = await prisma.liveSession.upsert({
      where: { serviceId: id },
      update: {
        sessionCode: newCode,
        isActive: true,
        currentItemId: null,
        currentSlide: 0,
        currentScroll: 0,
        isPaused: true,
        updatedAt: new Date()
      },
      create: {
        serviceId: id,
        sessionCode: newCode,
        isActive: true,
        isPaused: true
      }
    });

    res.json(session);
  } catch (error) {
    console.error('Go Live Error:', error);
    res.status(500).json({ error: 'Failed to go live for service' });
  }
};
