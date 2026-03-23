const express = require('express');
const router  = express.Router();
const {
  getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, getPerformance,
} = require('../controllers/supplierController');
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.route('/')
  .get(protect, authorize('view:suppliers'), getSuppliers)
  .post(protect, authorize('create:suppliers'), createSupplier);

router.route('/:id/performance')
  .get(protect, authorize('view:suppliers'), getPerformance);

router.route('/:id')
  .get(protect, authorize('view:suppliers'), getSupplier)
  .put(protect, authorize('edit:suppliers'), updateSupplier)
  .delete(protect, authorize('delete:suppliers'), deleteSupplier);

module.exports = router;
