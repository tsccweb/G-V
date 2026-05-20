const express = require('express');
const { searchOnline, importSong } = require('../controllers/importController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { planGuard } = require('../middlewares/planGuard');

const router = express.Router();

router.use(authMiddleware);
router.use(planGuard('PRO')); // Restrict to PRO plan

router.get('/search', searchOnline);
router.post('/import', importSong);

module.exports = router;
