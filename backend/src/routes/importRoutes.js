const express = require('express');
const multer = require('multer');
const { searchOnline, importSong, importPdf } = require('../controllers/importController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { planGuard } = require('../middlewares/planGuard');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);
router.use(planGuard('FREE')); // Allow FREE for testing (was PRO)

router.get('/search', searchOnline);
router.post('/import', importSong);
router.post('/pdf', upload.single('pdf'), importPdf);

module.exports = router;
