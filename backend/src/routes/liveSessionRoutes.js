const express = require('express');
const router = express.Router();
const lsc = require('../controllers/liveSessionController');
const { protect } = require('../middlewares/authMiddleware');

// Public: join by code and poll state (no auth required for audience)
router.get('/join/:code', lsc.joinByCode);
router.get('/:id', lsc.getState);

// Protected: sync state (Leader only)
router.post('/:id/sync', protect, lsc.syncState);

module.exports = router;
