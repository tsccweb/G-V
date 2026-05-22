const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const axios = require('axios');

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
        phone: phone !== undefined ? phone : undefined,
        role: role !== undefined ? role : undefined
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

// ─── FORGOT PASSWORD ─────────────────────────────────────────

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.authProvider === 'GOOGLE') return res.status(400).json({ error: 'Please use Google Login for this account' });

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60000); // 15 mins

    // Save/Update OTP
    await prisma.oTP.deleteMany({ where: { email } });
    await prisma.oTP.create({
      data: { email, code: otpCode, expiresAt }
    });

    // Send via Brevo
    const brevoKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : null;
    
    if (!brevoKey) {
      console.error('[AuthController] Missing BREVO_API_KEY');
      return res.status(500).json({ error: 'Email service configuration missing' });
    }

    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { name: 'Psalms Worship', email: 'tsccresurrection@gmail.com' },
        to: [{ email }],
        subject: 'Your Password Reset Code',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; }
              .container { max-width: 600px; margin: 40px auto; padding: 40px; background: #000000; border: 1px solid #333333; border-radius: 24px; }
              .logo { text-align: center; margin-bottom: 40px; }
              .logo h1 { font-size: 32px; font-weight: 900; letter-spacing: -2px; margin: 0; background: linear-gradient(to bottom, #ffffff, #888888); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
              .content { text-align: center; }
              .title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
              .subtitle { color: #888888; font-size: 14px; margin-bottom: 32px; }
              .code-container { background: #111111; border: 1px solid #222222; border-radius: 16px; padding: 32px; margin: 24px 0; }
              .code { font-size: 48px; font-weight: 900; letter-spacing: 8px; color: #ffffff; line-height: 1; }
              .footer { text-align: center; margin-top: 40px; color: #555555; font-size: 12px; }
              .divider { height: 1px; background: #222222; margin: 32px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">
                <h1>G&gt;/\\V</h1>
              </div>
              <div class="content">
                <div class="title">Reset Your Password</div>
                <div class="subtitle">Use the verification code below to reset your account password. This code will expire in 15 minutes.</div>
                
                <div class="code-container">
                  <div class="code">${otpCode}</div>
                </div>
                
                <div class="divider"></div>
                
                <div class="footer">
                  If you didn't request this code, you can safely ignore this email.<br>
                  &copy; ${new Date().getFullYear()} Psalms Worship. All rights reserved.
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      }, {
        headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' }
      });
    } catch (brevoError) {
      console.error('[AuthController] Brevo API Error:', brevoError.response ? brevoError.response.data : brevoError.message);
      return res.status(500).json({ 
        error: 'Failed to send OTP email', 
        details: brevoError.response ? brevoError.response.data : brevoError.message 
      });
    }

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('[AuthController] Forgot Password General Error:', error);
    res.status(500).json({ error: 'Internal server error during password recovery' });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, code } = req.body;
  try {
    const otp = await prisma.oTP.findFirst({
      where: { email, code, expiresAt: { gt: new Date() } }
    });
    if (!otp) return res.status(400).json({ error: 'Invalid or expired code' });
    res.json({ message: 'OTP verified', valid: true });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    // Re-verify OTP one last time
    const otp = await prisma.oTP.findFirst({
      where: { email, code, expiresAt: { gt: new Date() } }
    });
    if (!otp) return res.status(400).json({ error: 'Session expired. Please try again.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, jwtVersion: { increment: 1 } }
    });

    // Cleanup
    await prisma.oTP.deleteMany({ where: { email } });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
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

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client('687528189146-64gpt46kkdipv6rcdeclrn9cuepnqaoj.apps.googleusercontent.com');

exports.googleLogin = async (req, res) => {
  const { credential, accessToken } = req.body;
  try {
    let payload;

    if (accessToken) {
      // Verify via Access Token (used for custom buttons)
      const googleRes = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
      payload = googleRes.data;
      // Map fields to match ticket.getPayload() structure
      payload.given_name = payload.given_name || payload.name?.split(' ')[0];
      payload.family_name = payload.family_name || payload.name?.split(' ').slice(1).join(' ');
    } else if (credential) {
      // Verify via ID Token (credential from standard button)
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: '687528189146-64gpt46kkdipv6rcdeclrn9cuepnqaoj.apps.googleusercontent.com',
      });
      payload = ticket.getPayload();
    } else {
      return res.status(400).json({ error: 'No Google credentials provided' });
    }

    const { email, given_name, family_name, picture } = payload;

    let user = await prisma.user.findUnique({
      where: { email },
      include: { settings: true }
    });

    if (!user) {
      // Create new user if they don't exist
      user = await prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for social logins
          firstName: given_name || 'Google',
          lastName: family_name || 'User',
          role: 'MEMBER',
          plan: 'FREE',
          avatarUrl: picture,
          authProvider: 'GOOGLE',
          settings: { create: {} }
        },
        include: { settings: true }
      });
    } else {
      // Update existing user info if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          jwtVersion: { increment: 1 },
          avatarUrl: picture || user.avatarUrl
        },
        include: { settings: true }
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, plan: user.plan, jwtVersion: user.jwtVersion },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (error) {
    console.error('[AuthController] Google Login Error:', error);
    res.status(500).json({ error: 'Google login failed', details: error.message });
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
