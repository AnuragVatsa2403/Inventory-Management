const express = require('express');
const router  = express.Router();
const {
  getAlerts, markRead, markAllRead, resolveAlert, triggerScan, checkProduct, getAlertSummary,
} = require('../controllers/alertController');
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

// GET  /api/alerts
router.get('/', protect, authorize('view:alerts'), getAlerts);

// GET  /api/alerts/summary
router.get('/summary', protect, authorize('view:alerts'), getAlertSummary);

// POST /api/alerts/scan
router.post('/scan', protect, authorize('manage:alerts'), triggerScan);

// POST /api/alerts/check/:productId
router.post('/check/:productId', protect, authorize('manage:alerts'), checkProduct);

// PUT  /api/alerts/read-all  ← before /:id
router.put('/read-all', protect, authorize('manage:alerts'), markAllRead);

// PUT  /api/alerts/:id/read
router.put('/:id/read', protect, authorize('manage:alerts'), markRead);

// PUT  /api/alerts/:id/resolve
router.put('/:id/resolve', protect, authorize('manage:alerts'), resolveAlert);

module.exports = router;
