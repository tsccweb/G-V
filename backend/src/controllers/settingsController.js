const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get user settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.userId }
    });
    
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: req.user.userId }
      });
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// Update user settings
exports.updateSettings = async (req, res) => {
  const { fontSize, fontFamily, bgColor, textColor, chordColor, scrollSpeed } = req.body;
  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user.userId },
      update: { fontSize, fontFamily, bgColor, textColor, chordColor, scrollSpeed },
      create: { 
        userId: req.user.userId,
        fontSize, fontFamily, bgColor, textColor, chordColor, scrollSpeed
      }
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// Reset to defaults
exports.resetSettings = async (req, res) => {
  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user.userId },
      update: {
        fontSize: 18,
        fontFamily: 'Inter',
        bgColor: '#000000',
        textColor: '#ffffff',
        chordColor: '#60a5fa',
        scrollSpeed: 50
      },
      create: { userId: req.user.userId }
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset settings' });
  }
};
