const express = require('express');
const router  = express.Router();
const {
  getCategories, getCategory, createCategory, updateCategory, deleteCategory,
} = require('../controllers/categoryController');
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.route('/')
  .get(protect, authorize('view:categories'), getCategories)
  .post(protect, authorize('create:categories'), createCategory);

router.route('/:id')
  .get(protect, authorize('view:categories'), getCategory)
  .put(protect, authorize('edit:categories'), updateCategory)
  .delete(protect, authorize('delete:categories'), deleteCategory);

module.exports = router;
