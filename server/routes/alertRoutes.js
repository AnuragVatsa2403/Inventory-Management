const express = require('express');
const router  = express.Router();
const {
  getAlerts, markRead, markAllRead, resolveAlert, triggerScan, checkProduct, getAlertSummary,
} = require('../controllers/alertController');
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');


router.get('/', protect, authorize('view:alerts'), getAlerts);

router.get('/summary', protect, authorize('view:alerts'), getAlertSummary);

router.post('/scan', protect, authorize('manage:alerts'), triggerScan);


router.post('/check/:productId', protect, authorize('manage:alerts'), checkProduct);


router.put('/read-all', protect, authorize('manage:alerts'), markAllRead);

router.put('/:id/read', protect, authorize('manage:alerts'), markRead);


router.put('/:id/resolve', protect, authorize('manage:alerts'), resolveAlert);

module.exports = router;
