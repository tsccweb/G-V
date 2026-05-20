const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const emails = [
    'pastor@psalms.com',
    'jasonanthonytrillo@gmail.com',
    'nichelletrillo@gmail.com'
  ];

  for (const email of emails) {
    try {
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      console.log(`Updated password for ${email} to "password123"`);
    } catch (e) {
      console.log(`Could not update ${email} (maybe it doesn't exist)`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
