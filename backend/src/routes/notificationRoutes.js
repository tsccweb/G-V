const express = require('express');
const { 
  getUnreadCount, 
  getNotifications, 
  markAsRead, 
  markAllAsRead 
} = require('../controllers/notificationController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/count', getUnreadCount);
router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

module.exports = router;
