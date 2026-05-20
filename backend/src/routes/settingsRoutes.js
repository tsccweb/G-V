const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, settingsController.getSettings);
router.put('/', protect, settingsController.updateSettings);
router.post('/reset', protect, settingsController.resetSettings);

module.exports = router;
