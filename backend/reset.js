const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.update({where: {email: 'jasonanthonytrillo@gmail.com'}, data: {plan: 'FREE'}})
  .then(() => console.log('Successfully set plan to FREE'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
