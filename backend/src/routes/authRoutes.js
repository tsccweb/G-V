const express = require('express');
const { register, login, getMe, getUsers, updateMe, changePassword } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateMe);
router.put('/me/password', authMiddleware, changePassword);
router.get('/users', authMiddleware, getUsers);

module.exports = router;
