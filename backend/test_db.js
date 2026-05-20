const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const users = await prisma.user.findMany({
      include: { settings: true }
    });
    console.log('Users found:', users.length);
    console.log('Users:', JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Prisma Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
