const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findUnique({where: {email: 'jasonanthonytrillo@gmail.com'}}).then(console.log).finally(() => prisma.$disconnect());
