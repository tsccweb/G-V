const express = require('express');
const router = express.Router();
const wf = require('../controllers/worshipFlowController');
const { protect } = require('../middlewares/authMiddleware');
const { roleGuard } = require('../middlewares/roleGuard');

router.use(protect);

// Flow CRUD
router.get('/', wf.getFlows);
router.get('/:id', wf.getFlowById);
router.post('/', roleGuard('ADMIN', 'PASTOR', 'WORSHIP_LEADER'), wf.createFlow);
router.put('/:id', roleGuard('ADMIN', 'PASTOR', 'WORSHIP_LEADER'), wf.updateFlow);
router.delete('/:id', roleGuard('ADMIN'), wf.deleteFlow);

// Song management within flow
router.post('/:id/songs', roleGuard('ADMIN', 'PASTOR', 'WORSHIP_LEADER', 'MUSICIAN', 'VOCALIST'), wf.addSong);
router.delete('/:id/songs/:songId', roleGuard('ADMIN', 'PASTOR', 'WORSHIP_LEADER', 'MUSICIAN', 'VOCALIST'), wf.removeSong);
router.put('/:id/songs/reorder', roleGuard('ADMIN', 'PASTOR', 'WORSHIP_LEADER', 'MUSICIAN', 'VOCALIST'), wf.reorderSongs);

// Live control
router.post('/:id/live', roleGuard('ADMIN', 'PASTOR', 'WORSHIP_LEADER'), wf.goLive);
router.post('/:id/end', roleGuard('ADMIN', 'PASTOR', 'WORSHIP_LEADER'), wf.endLive);

module.exports = router;
