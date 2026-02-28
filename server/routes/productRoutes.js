const express = require('express');
const router  = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct, getLowStockAlerts,
} = require('../controllers/productController');
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

// GET  /api/products/alerts/low-stock  ← must be before /:id
router.get('/alerts/low-stock', protect, getLowStockAlerts);

// GET  /api/products
// POST /api/products
router.route('/')
  .get(protect, authorize('view:products'), getProducts)
  .post(protect, authorize('create:products'), createProduct);

// GET    /api/products/:id
// PUT    /api/products/:id
// DELETE /api/products/:id
router.route('/:id')
  .get(protect, authorize('view:products'), getProduct)
  .put(protect, authorize('edit:products'), updateProduct)
  .delete(protect, authorize('delete:products'), deleteProduct);

module.exports = router;
