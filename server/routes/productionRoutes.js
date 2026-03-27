const express = require('express');
const router  = express.Router();
const {
  getEntries, getEntry, createEntry, completeProduction, cancelEntry, getStats,
} = require('../controllers/productionController');
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.get('/stats',          protect, authorize('view:production'),   getStats);
router.get('/',               protect, authorize('view:production'),   getEntries);
router.post('/',              protect, authorize('create:production'), createEntry);
router.get('/:id',            protect, authorize('view:production'),   getEntry);
router.post('/:id/complete',  protect, authorize('edit:production'),   completeProduction);
router.put('/:id/cancel',     protect, authorize('edit:production'),   cancelEntry);

module.exports = router;
