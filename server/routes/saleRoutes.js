const express = require('express');
const router  = express.Router();
const {
  getSales, getSale, createSale, updateSale, deleteSale, dispatchSale, getSalesSummary,
} = require('../controllers/saleController');
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.get('/summary', protect, authorize('view:sales'), getSalesSummary);

router.route('/')
  .get(protect, authorize('view:sales'), getSales)
  .post(protect, authorize('create:sales'), createSale);

router.route('/:id')
  .get(protect, authorize('view:sales'), getSale)
  .put(protect, authorize('edit:sales'), updateSale)
  .delete(protect, authorize('delete:sales'), deleteSale);

router.post('/:id/dispatch', protect, authorize('dispatch:sales'), dispatchSale);

module.exports = router;
