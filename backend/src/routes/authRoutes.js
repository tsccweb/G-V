const express = require('express');
const { register, login, getMe, getUsers, updateMe, changePassword, googleLogin } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateMe);
router.put('/me/password', authMiddleware, changePassword);
router.get('/users', authMiddleware, getUsers);

module.exports = router;
