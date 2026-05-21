const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

exports.register = async (req, res) => {
  const { email, password, firstName, middleName, lastName, phone, role } = req.body;
  
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'First name, last name, email and password are required' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        middleName: middleName || null,
        lastName,
        phone: phone || null,
        role: role || 'MEMBER',
        settings: { create: {} } // Create default settings
      },
      include: { settings: true }
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role, plan: user.plan, jwtVersion: user.jwtVersion },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...safeUser } = user;
    res.status(201).json({ user: safeUser, token });
  } catch (error) {
    console.error('[AuthController] Register Error:', error);
    res.status(400).json({ error: 'Registration failed', details: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await prisma.user.findUnique({ 
      where: { email },
      include: { settings: true }
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Invalidate previous sessions by incrementing jwtVersion
    user = await prisma.user.update({
      where: { id: user.id },
      data: { jwtVersion: { increment: 1 } },
      include: { settings: true }
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role, plan: user.plan, jwtVersion: user.jwtVersion },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (error) {
    console.error('[AuthController] Login Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true, email: true, firstName: true, middleName: true, lastName: true,
        phone: true, role: true, plan: true, settings: true
      }
    });
    res.json(user);
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateMe = async (req, res) => {
  const { firstName, middleName, lastName, phone } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        firstName: firstName !== undefined ? firstName : undefined,
        middleName: middleName !== undefined ? middleName : undefined,
        lastName: lastName !== undefined ? lastName : undefined,
        phone: phone !== undefined ? phone : undefined
      },
      select: {
        id: true, email: true, firstName: true, middleName: true, lastName: true,
        phone: true, role: true, plan: true, settings: true
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedPassword }
    });
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true, email: true, role: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};
