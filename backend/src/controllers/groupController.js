const prisma = require('../utils/prisma');

// Create Group
exports.createGroup = async (req, res) => {
  const { name, description, memberIds } = req.body;
  try {
    const group = await prisma.group.create({
      data: {
        name,
        description,
        userId: req.user.userId,
        members: {
          connect: (memberIds || []).map(id => ({ id }))
        }
      },
      include: {
        members: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true }
        }
      }
    });
    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to create group' });
  }
};

// Get All Groups owned by user
exports.getGroups = async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      where: { userId: req.user.userId },
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

// Get Group by ID
exports.getGroupById = async (req, res) => {
  try {
    const group = await prisma.group.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      },
      include: {
        members: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true }
        }
      }
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update Group
exports.updateGroup = async (req, res) => {
  const { name, description, memberIds } = req.body;
  try {
    // First, disconnect all members to reset (Prisma handles this cleanly in a single update if desired, 
    // but explicit reset is safer for complex many-to-many updates)
    const group = await prisma.group.update({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      },
      data: {
        name,
        description,
        members: {
          set: (memberIds || []).map(id => ({ id }))
        }
      },
      include: {
        members: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true }
        }
      }
    });
    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to update group' });
  }
};

// Delete Group
exports.deleteGroup = async (req, res) => {
  try {
    await prisma.group.deleteMany({ 
      where: { 
        id: req.params.id,
        userId: req.user.userId
      } 
    });
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete group' });
  }
};

// Add Members to Group
exports.addMembers = async (req, res) => {
  const { memberIds } = req.body;
  try {
    const group = await prisma.group.update({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      },
      data: {
        members: {
          connect: memberIds.map(id => ({ id }))
        }
      },
      include: {
        members: true
      }
    });
    res.json(group);
  } catch (error) {
    res.status(400).json({ error: 'Failed to add members' });
  }
};

// Remove Member from Group
exports.removeMember = async (req, res) => {
  const { memberId } = req.params;
  try {
    const group = await prisma.group.update({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      },
      data: {
        members: {
          disconnect: { id: memberId }
        }
      }
    });
    res.json(group);
  } catch (error) {
    res.status(400).json({ error: 'Failed to remove member' });
  }
};
