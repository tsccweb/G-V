const express = require('express');
const { createSong, getSongs, getSongById, updateSong, deleteSong } = require('../controllers/songController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleGuard } = require('../middlewares/roleGuard');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getSongs);
router.get('/:id', getSongById);
router.post('/', createSong);
router.put('/:id', updateSong);
router.delete('/:id', roleGuard('ADMIN'), deleteSong);

module.exports = router;
