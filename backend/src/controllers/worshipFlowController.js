const prisma = require('../utils/prisma');
const crypto = require('crypto');

// Generate a 6-digit session code
const generateCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Create Worship Flow
exports.createFlow = async (req, res) => {
  const { title, notes } = req.body;
  try {
    const flow = await prisma.worshipFlow.create({
      data: {
        title,
        notes,
        userId: req.user.userId
      },
      include: { songs: { include: { song: true }, orderBy: { order: 'asc' } } }
    });
    res.status(201).json(flow);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to create worship flow' });
  }
};

// Get all worship flows
exports.getFlows = async (req, res) => {
  try {
    const flows = await prisma.worshipFlow.findMany({
      where: { userId: req.user.userId },
      include: { 
        songs: { include: { song: true }, orderBy: { order: 'asc' } },
        createdBy: { select: { firstName: true, lastName: true } },
        liveSession: { select: { sessionCode: true, isActive: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(flows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch flows' });
  }
};

// Get single flow by ID
exports.getFlowById = async (req, res) => {
  try {
    const flow = await prisma.worshipFlow.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      },
      include: { 
        songs: { include: { song: true }, orderBy: { order: 'asc' } },
        createdBy: { select: { firstName: true, lastName: true } },
        liveSession: true
      }
    });
    if (!flow) return res.status(404).json({ error: 'Flow not found' });
    res.json(flow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch flow' });
  }
};

// Update worship flow
exports.updateFlow = async (req, res) => {
  const { title, notes, status } = req.body;
  try {
    const flow = await prisma.worshipFlow.update({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      },
      data: { title, notes, status },
      include: { songs: { include: { song: true }, orderBy: { order: 'asc' } } }
    });
    res.json(flow);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update flow' });
  }
};

// Delete worship flow
exports.deleteFlow = async (req, res) => {
  try {
    const result = await prisma.worshipFlow.deleteMany({ 
      where: { 
        id: req.params.id,
        userId: req.user.userId
      } 
    });
    if (result.count === 0) return res.status(404).json({ error: 'Flow not found or unauthorized' });
    res.json({ message: 'Flow deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete flow' });
  }
};

// Add song to flow
exports.addSong = async (req, res) => {
  const { songId, notes, assignedLeader, assignedGuitarist, assignedOrganist, assignedDrummer, assignedVocalists } = req.body;
  try {
    // Verify flow ownership
    const flow = await prisma.worshipFlow.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });
    if (!flow) return res.status(403).json({ error: 'Unauthorized' });

    const maxOrder = await prisma.worshipFlowSong.findFirst({
      where: { worshipFlowId: req.params.id },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const song = await prisma.worshipFlowSong.create({
      data: {
        worshipFlowId: req.params.id,
        songId,
        order: (maxOrder?.order ?? -1) + 1,
        notes,
        assignedLeader,
        assignedGuitarist,
        assignedOrganist,
        assignedDrummer,
        assignedVocalists: assignedVocalists || []
      },
      include: { song: true }
    });
    res.status(201).json(song);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to add song to flow' });
  }
};

// Remove song from flow
exports.removeSong = async (req, res) => {
  try {
    const result = await prisma.worshipFlowSong.deleteMany({ 
      where: { 
        id: req.params.songId,
        worshipFlow: { userId: req.user.userId }
      } 
    });
    if (result.count === 0) return res.status(404).json({ error: 'Song not found or unauthorized' });
    res.json({ message: 'Song removed from flow' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove song' });
  }
};

// Reorder songs in flow
exports.reorderSongs = async (req, res) => {
  const { orderedIds } = req.body; // Array of worshipFlowSong IDs in new order
  try {
    const updates = orderedIds.map((id, index) =>
      prisma.worshipFlowSong.update({
        where: { 
          id,
          worshipFlow: { userId: req.user.userId }
        },
        data: { order: index }
      })
    );
    await prisma.$transaction(updates);
    res.json({ message: 'Songs reordered' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to reorder songs' });
  }
};

// Go Live — create a live session for this flow
exports.goLive = async (req, res) => {
  try {
    // Verify flow ownership
    const flow = await prisma.worshipFlow.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });
    if (!flow) return res.status(403).json({ error: 'Unauthorized' });

    // Deactivate any existing session
    await prisma.liveSession.updateMany({
      where: { worshipFlowId: req.params.id, isActive: true },
      data: { isActive: false }
    });

    const session = await prisma.liveSession.create({
      data: {
        worshipFlowId: req.params.id,
        sessionCode: generateCode(),
        isActive: true
      }
    });

    await prisma.worshipFlow.update({
      where: { id: req.params.id },
      data: { status: 'LIVE' }
    });

    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to go live' });
  }
};

// End Live
exports.endLive = async (req, res) => {
  try {
    const result = await prisma.worshipFlow.updateMany({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      },
      data: { status: 'COMPLETED' }
    });

    if (result.count === 0) return res.status(404).json({ error: 'Flow not found or unauthorized' });

    await prisma.liveSession.updateMany({
      where: { worshipFlowId: req.params.id, isActive: true },
      data: { isActive: false }
    });

    res.json({ message: 'Live session ended' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to end live session' });
  }
};
