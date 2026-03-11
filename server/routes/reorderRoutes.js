const express  = require('express');
const router   = express.Router();
const { triggerReorder, getReorderHistory } = require('../controllers/reorderController');
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.post('/run', protect, authorize('manage:reorder'), triggerReorder);


router.get('/history', protect, authorize('view:orders'), getReorderHistory);

module.exports = router;
