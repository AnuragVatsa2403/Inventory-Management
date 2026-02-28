const express  = require('express');
const router   = express.Router();
const { getUsers, createUser, updateUser, deleteUser, getMyPermissions } = require('../controllers/userController');
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

// GET /api/users/me/permissions  ← before /:id
router.get('/me/permissions', protect, getMyPermissions);

router.route('/')
  .get(protect, authorize('view:users'), getUsers)
  .post(protect, authorize('edit:users'), createUser);

router.route('/:id')
  .put(protect, authorize('edit:users'), updateUser)
  .delete(protect, authorize('edit:users'), deleteUser);

module.exports = router;
