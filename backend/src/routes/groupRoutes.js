const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect); // All group routes protected

router.route('/')
  .post(groupController.createGroup)
  .get(groupController.getGroups);

router.route('/:id')
  .get(groupController.getGroupById)
  .put(groupController.updateGroup)
  .delete(groupController.deleteGroup);

router.post('/:id/members', groupController.addMembers);
router.delete('/:id/members/:memberId', groupController.removeMember);

module.exports = router;
