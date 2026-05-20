const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const song = await prisma.song.findFirst({
    where: { title: { contains: 'Pupurihin' } }
  });
  if (song) {
    console.log('--- RAW LYRICS ---');
    console.log(JSON.stringify(song.lyrics));
    console.log('--- END RAW LYRICS ---');
  } else {
    console.log('Song not found');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
