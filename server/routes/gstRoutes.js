const express = require('express');
const router  = express.Router();
const {
  getHSNCodes, getStates, calculateGSTPreview, applyGSTToOrder, monthlySummary,
} = require('../controllers/gstController');
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

// Reference data — no special permission needed
router.get('/hsn-codes',       protect, getHSNCodes);
router.get('/states',          protect, getStates);

// Calculate preview (used in SalesOrder form before saving)
router.post('/calculate',      protect, calculateGSTPreview);

// Apply GST to an existing order
router.post('/apply/:saleId',  protect, authorize('edit:sales'), applyGSTToOrder);

// Monthly GST summary report
router.get('/monthly-summary', protect, authorize('view:reports'), monthlySummary);

module.exports = router;
