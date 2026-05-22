const express = require('express');
const { searchOnline, importSong } = require('../controllers/importController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { planGuard } = require('../middlewares/planGuard');

const router = express.Router();

router.use(authMiddleware);
router.use(planGuard('FREE')); // Allow FREE for testing (was PRO)

router.get('/search', searchOnline);
router.post('/import', importSong);

module.exports = router;
