const express = require('express');
const { updatePlan, getPlan, getPendingRequest } = require('../controllers/subscriptionController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getPlan);
router.put('/', updatePlan);
router.get('/pending', getPendingRequest);

module.exports = router;
