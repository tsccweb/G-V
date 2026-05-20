const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function run() {
  try {
    const user = await prisma.user.findFirst();
    const token = jwt.sign({ userId: user.id, role: user.role, plan: user.plan }, process.env.JWT_SECRET || 'your_jwt_secret_here', { expiresIn: '1h' });
    
    console.log('Fetching single song with token...');
    const result = await axios.get('http://localhost:5000/api/songs/494c6958-81ab-4f88-b298-ba6101828b0a', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('SUCCESS:', result.data.title);
  } catch (err) {
    console.error('API ERROR RESPONSE:', err.response ? err.response.data : err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
