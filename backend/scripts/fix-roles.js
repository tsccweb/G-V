const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting role migration...');

  // Map legacy roles to new simplified roles
  const rolesToMember = ['SCRIPTURE_READER', 'PRAYER_LEADER', 'MEDIA_TEAM', 'SOUND_TEAM'];
  const rolesToMusician = ['VOCALIST'];

  const memberUpdate = await prisma.user.updateMany({
    where: {
      role: { in: rolesToMember }
    },
    data: {
      role: 'MEMBER'
    }
  });
  console.log(`Updated ${memberUpdate.count} users to MEMBER`);

  const musicianUpdate = await prisma.user.updateMany({
    where: {
      role: { in: rolesToMusician }
    },
    data: {
      role: 'MUSICIAN'
    }
  });
  console.log(`Updated ${musicianUpdate.count} users to MUSICIAN`);

  console.log('Role migration completed.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
