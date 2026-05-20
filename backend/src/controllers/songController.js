const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create Song
exports.createSong = async (req, res) => {
  const { title, artist, lyrics, chords, key, capo, bpm, language, notes, tags, category } = req.body;
  try {
    // Check for plan limits
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { plan: true, _count: { select: { songs: true } } }
    });

    if (user.plan === 'FREE' && user._count.songs >= 7) {
      return res.status(403).json({ 
        error: 'Song limit reached', 
        message: 'Free plan is limited to 7 songs. Please upgrade to Standard for unlimited storage.' 
      });
    }

    const song = await prisma.song.create({
      data: {
        title,
        artist,
        lyrics,
        chords,
        key,
        capo: parseInt(capo) || 0,
        bpm: parseInt(bpm) || null,
        language,
        notes,
        category,
        tags: tags || [], // Simple string array
        userId: req.user.userId
      }
    });
    res.status(201).json(song);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to create song' });
  }
};

// Get All Songs with Global Search
exports.getSongs = async (req, res) => {
  const { q, category, tag } = req.query;
  try {
    const where = {
      userId: req.user.userId,
    };

    // Global Search across title, artist, and lyrics
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { artist: { contains: q, mode: 'insensitive' } },
        { lyrics: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (category) where.category = category;
    if (tag) where.tags = { has: tag };

    const songs = await prisma.song.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    });
    res.json(songs);
  } catch (error) {
    console.error('getSongs Error:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
};

// Get Song by ID
exports.getSongById = async (req, res) => {
  try {
    const song = await prisma.song.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      }
    });
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json(song);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update Song
exports.updateSong = async (req, res) => {
  const { title, artist, lyrics, chords, key, capo, bpm, language, notes, tags, category } = req.body;
  try {
    const song = await prisma.song.updateMany({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      },
      data: {
        title,
        artist,
        lyrics,
        chords,
        key,
        capo: parseInt(capo) || 0,
        bpm: parseInt(bpm) || null,
        language,
        notes,
        category,
        tags: tags || []
      }
    });
    res.json(song);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to update song' });
  }
};

// Delete Song
exports.deleteSong = async (req, res) => {
  try {
    const result = await prisma.song.deleteMany({ 
      where: { 
        id: req.params.id,
        userId: req.user.userId
      } 
    });
    if (result.count === 0) return res.status(404).json({ error: 'Song not found or unauthorized' });
    res.json({ message: 'Song deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete song' });
  }
};
