const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const songs = await prisma.song.findMany({ 
      include: { tags: true },
      orderBy: { updatedAt: 'desc' }
    });
    console.log(songs.length, 'songs found');
  } catch (error) {
    console.error('ERROR MESSAGE:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
