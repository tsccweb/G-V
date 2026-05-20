const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'jasonsnthonytrillo@gmail.com';
  const updated = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
    select: { email: true, role: true }
  });
  console.log(`Successfully updated ${updated.email} to ${updated.role}`);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
