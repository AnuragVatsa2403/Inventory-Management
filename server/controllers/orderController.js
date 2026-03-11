const PurchaseOrder = require('../models/PurchaseOrder');
const GoodsReceipt  = require('../models/GoodsReceipt');
const StockLedger   = require('../models/StockLedger');
const { checkProductAlert } = require('../services/alertService');


const getOrders = async (req, res) => {
  try {
    const { status, supplierId, from, to } = req.query;
    const filter = {};

    if (status)     filter.status     = status;
    if (supplierId) filter.supplierId = supplierId;
    if (from || to) {
      filter.orderDate = {};
      if (from) filter.orderDate.$gte = new Date(from);
      if (to)   filter.orderDate.$lte = new Date(to);
    }

    const orders = await PurchaseOrder.find(filter)
      .populate('supplierId', 'supplierName contactInfo leadTimeDays')
      .populate('items.itemId', 'itemName itemType unit')
      .sort('-orderDate');

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate('supplierId', 'supplierName contactInfo leadTimeDays')
      .populate('items.itemId', 'itemName itemType unit batchNumber');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const grns = await GoodsReceipt.find({ purchaseOrderId: order._id })
      .populate('itemId', 'itemName');

    res.json({ ...order.toObject(), goodsReceipts: grns });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.create(req.body);
    await order.populate('supplierId', 'supplierName');
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'Received')
      return res.status(400).json({ message: 'Cannot edit a fully received order' });

    Object.assign(order, req.body);
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'Pending')
      return res.status(400).json({ message: 'Only pending orders can be deleted' });

    await order.deleteOne();
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const receiveOrder = async (req, res) => {
  try {
    const { itemId, quantityReceived, batchNumber, notes } = req.body;
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'Cancelled')
      return res.status(400).json({ message: 'Cannot receive a cancelled order' });

    const lineItem = order.items.find((i) => i.itemId.toString() === itemId);
    if (!lineItem) return res.status(404).json({ message: 'Item not found in this order' });

    const remaining = lineItem.quantityOrdered - lineItem.quantityReceived;
    if (quantityReceived > remaining)
      return res.status(400).json({ message: `Only ${remaining} units remaining to receive` });

    const grn = await GoodsReceipt.create({
      purchaseOrderId: order._id,
      itemId,
      batchNumber,
      quantityReceived,
      receivedBy: req.user.id,
      notes,
    });


    const ledgerFilter = { itemId, batchNumber: batchNumber || 'DEFAULT' };
    await StockLedger.findOneAndUpdate(
      ledgerFilter,
      { $inc: { quantityOnHand: quantityReceived }, $set: { itemId, batchNumber } },
      { upsert: true, new: true }
    );


    lineItem.quantityReceived += quantityReceived;
    lineItem.partialReceipt = lineItem.quantityReceived < lineItem.quantityOrdered;

    order.updateStatus();
    await order.save();

    checkProductAlert(itemId).catch(console.error);

    res.status(201).json({ message: 'Stock received successfully', grn, orderStatus: order.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getOrders, getOrder, createOrder, updateOrder, deleteOrder, receiveOrder };
