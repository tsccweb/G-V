const express = require('express');
const { 
  createService, 
  getServices, 
  getServiceById, 
  updateServiceItems, 
  addServiceItem,
  addToLineup, 
  getMyInvitations, 
  respondToInvitation, 
  getMyTeam,
  removeFromLineup 
} = require('../controllers/serviceController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createService);
router.get('/', getServices);
router.get('/lineup/invitations', getMyInvitations);
router.get('/team', getMyTeam);
router.put('/lineup/:id', respondToInvitation);
router.get('/:id', getServiceById);
router.delete('/:id', (req, res, next) => {
  const { deleteService } = require('../controllers/serviceController');
  return deleteService(req, res, next);
});
router.put('/:id/items', updateServiceItems);
router.post('/:serviceId/items', addServiceItem);
router.delete('/:serviceId/items/:itemId', (req, res, next) => {
  const { removeServiceItem } = require('../controllers/serviceController');
  return removeServiceItem(req, res, next);
});
router.post('/:id/live', (req, res, next) => {
  // We'll add goLiveService to controller in next step
  const { goLiveService } = require('../controllers/serviceController');
  return goLiveService(req, res, next);
});
router.post('/lineup', addToLineup);
router.delete('/:serviceId/lineup/:id', removeFromLineup);

module.exports = router;
