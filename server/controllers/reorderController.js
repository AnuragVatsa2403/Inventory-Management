const { runReorderAutomation } = require('../services/reorderService');
const PurchaseOrder = require('../models/PurchaseOrder');

const triggerReorder = async (req, res) => {
  try {
    const results = await runReorderAutomation();
    res.json({ message: 'Reorder automation complete', results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getReorderHistory = async (req, res) => {
  try {
    const orders = await PurchaseOrder.find({ notes: /Auto-generated reorder/ })
      .populate('supplierId', 'supplierName')
      .populate('items.itemId', 'itemName unit')
      .sort('-createdAt')
      .limit(50);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { triggerReorder, getReorderHistory };
