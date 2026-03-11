const express = require('express');
const router  = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct, getLowStockAlerts,
} = require('../controllers/productController');
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');


router.get('/alerts/low-stock', protect, getLowStockAlerts);


router.route('/')
  .get(protect, authorize('view:products'), getProducts)
  .post(protect, authorize('create:products'), createProduct);


router.route('/:id')
  .get(protect, authorize('view:products'), getProduct)
  .put(protect, authorize('edit:products'), updateProduct)
  .delete(protect, authorize('delete:products'), deleteProduct);

module.exports = router;
