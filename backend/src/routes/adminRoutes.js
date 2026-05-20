const express = require('express');
const { 
  getAllUsers, 
  updateUser, 
  deleteUser, 
  getSubscriptionRequests, 
  handleSubscriptionRequest 
} = require('../controllers/adminController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { adminMiddleware } = require('../middlewares/adminMiddleware');

const router = express.Router();

// All routes require authentication AND admin role
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/requests', getSubscriptionRequests);
router.put('/requests/:id', handleSubscriptionRequest);

module.exports = router;
