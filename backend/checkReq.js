const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.subscriptionRequest.findMany({
  include: { user: true },
  orderBy: { createdAt: 'desc' },
  take: 5
}).then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
