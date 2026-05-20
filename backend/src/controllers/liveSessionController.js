const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Join session by code
exports.joinByCode = async (req, res) => {
  const { code } = req.params;
  try {
    const session = await prisma.liveSession.findFirst({
      where: { sessionCode: code, isActive: true },
      include: {
        worshipFlow: {
          include: {
            songs: { include: { song: true }, orderBy: { order: 'asc' } },
            createdBy: { select: { firstName: true, lastName: true } }
          }
        },
        service: {
          include: {
            items: { include: { song: true }, orderBy: { order: 'asc' } },
            createdBy: { select: { id: true } }
          }
        }
      }
    });
    if (!session) return res.status(404).json({ error: 'Session not found or expired' });

    // Auto-link enrichment: if a service item has no song linked, try to find one by title
    if (session.service?.items) {
      const enrichedItems = await Promise.all(session.service.items.map(async (item) => {
        if (!item.song && item.type === 'SONG') {
          const foundSong = await prisma.song.findFirst({
            where: {
              title: { equals: item.title, mode: 'insensitive' },
              userId: session.service.createdBy?.id
            }
          });
          return { ...item, song: foundSong };
        }
        return item;
      }));
      session.service.items = enrichedItems;
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to join session' });
  }
};

// Sync Live Session State (Leader pushes)
exports.syncState = async (req, res) => {
  const { id } = req.params;
  const { currentItemId, currentSlide, currentScroll, isPaused } = req.body;
  try {
    const session = await prisma.liveSession.update({
      where: { id },
      data: { currentItemId, currentSlide, currentScroll, isPaused, updatedAt: new Date() }
    });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync live state' });
  }
};

// Get Live Session State (Team polls)
exports.getState = async (req, res) => {
  const { id } = req.params;
  try {
    const session = await prisma.liveSession.findUnique({
      where: { id },
      include: {
        worshipFlow: {
          include: { 
            songs: { include: { song: true }, orderBy: { order: 'asc' } },
            createdBy: { select: { firstName: true, lastName: true } }
          }
        },
        service: {
          include: {
            items: { include: { song: true }, orderBy: { order: 'asc' } },
            createdBy: { select: { id: true } }
          }
        }
      }
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Auto-link enrichment: if a service item has no song linked, try to find one by title
    if (session.service?.items) {
      const enrichedItems = await Promise.all(session.service.items.map(async (item) => {
        if (!item.song && item.type === 'SONG') {
          const foundSong = await prisma.song.findFirst({
            where: {
              title: { equals: item.title, mode: 'insensitive' },
              userId: session.service.createdBy?.id
            }
          });
          return { ...item, song: foundSong };
        }
        return item;
      }));
      session.service.items = enrichedItems;
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch live session' });
  }
};
