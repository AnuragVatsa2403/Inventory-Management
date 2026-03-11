const express = require('express');
const router  = express.Router();
const {
  getOrders, getOrder, createOrder, updateOrder, deleteOrder, receiveOrder,
} = require('../controllers/orderController');
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.route('/')
  .get(protect, authorize('view:orders'), getOrders)
  .post(protect, authorize('create:orders'), createOrder);

router.route('/:id')
  .get(protect, authorize('view:orders'), getOrder)
  .put(protect, authorize('edit:orders'), updateOrder)
  .delete(protect, authorize('delete:orders'), deleteOrder);


router.post('/:id/receive', protect, authorize('receive:orders'), receiveOrder);

module.exports = router;
