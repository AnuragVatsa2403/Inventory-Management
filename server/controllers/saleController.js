const SalesOrder  = require('../models/SalesOrder');
const StockLedger = require('../models/StockLedger');
const { checkProductAlert } = require('../services/alertService');

// @route GET /api/sales
const getSales = async (req, res) => {
  try {
    const { paymentStatus, dispatchStatus, itemId, from, to } = req.query;
    const filter = {};

    if (paymentStatus)  filter.paymentStatus  = paymentStatus;
    if (dispatchStatus) filter.dispatchStatus = dispatchStatus;
    if (itemId)         filter.itemId         = itemId;
    if (from || to) {
      filter.saleDate = {};
      if (from) filter.saleDate.$gte = new Date(from);
      if (to)   filter.saleDate.$lte = new Date(to);
    }

    const sales = await SalesOrder.find(filter)
      .populate('itemId', 'itemName itemType unit')
      .sort('-saleDate');

    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/sales/:id
const getSale = async (req, res) => {
  try {
    const sale = await SalesOrder.findById(req.params.id)
      .populate('itemId', 'itemName itemType unit batchNumber department');
    if (!sale) return res.status(404).json({ message: 'Sales order not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/sales
const createSale = async (req, res) => {
  try {
    const { itemId, quantityOrdered } = req.body;

    // Check available stock before creating sale
    const stock = await StockLedger.getTotalAvailable(itemId);
    if (stock.totalAvailable < quantityOrdered) {
      return res.status(400).json({
        message: `Insufficient stock. Available: ${stock.totalAvailable}`,
      });
    }

    // Reserve the stock
    await StockLedger.findOneAndUpdate(
      { itemId },
      { $inc: { reservedQuantity: quantityOrdered } },
      { sort: { availableQuantity: -1 } } // use batch with most stock first
    );

    const sale = await SalesOrder.create(req.body);
    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/sales/:id
const updateSale = async (req, res) => {
  try {
    const sale = await SalesOrder.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('itemId', 'itemName itemType unit');
    if (!sale) return res.status(404).json({ message: 'Sales order not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/sales/:id  (cancel)
const deleteSale = async (req, res) => {
  try {
    const sale = await SalesOrder.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sales order not found' });
    if (sale.dispatchStatus === 'Dispatched')
      return res.status(400).json({ message: 'Cannot cancel a dispatched order' });

    // Release reserved stock
    const unreleased = sale.quantityOrdered - sale.quantityDispatched;
    if (unreleased > 0) {
      await StockLedger.findOneAndUpdate(
        { itemId: sale.itemId },
        { $inc: { reservedQuantity: -unreleased } }
      );
    }

    sale.dispatchStatus = 'Cancelled';
    await sale.save();
    res.json({ message: 'Sales order cancelled, stock reservation released' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/sales/:id/dispatch
// KEY FLOW: Mark dispatched → deduct quantityOnHand from StockLedger
const dispatchSale = async (req, res) => {
  try {
    const { quantityDispatched } = req.body;
    const sale = await SalesOrder.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sales order not found' });
    if (sale.dispatchStatus === 'Dispatched')
      return res.status(400).json({ message: 'Order already fully dispatched' });

    const remaining = sale.quantityOrdered - sale.quantityDispatched;
    if (quantityDispatched > remaining)
      return res.status(400).json({ message: `Only ${remaining} units left to dispatch` });

    // Deduct from StockLedger (quantityOnHand & reservedQuantity)
    await StockLedger.findOneAndUpdate(
      { itemId: sale.itemId },
      {
        $inc: {
          quantityOnHand:   -quantityDispatched,
          reservedQuantity: -quantityDispatched,
        },
      }
    );

    sale.quantityDispatched += quantityDispatched;
    sale.updateDispatchStatus();
    await sale.save();

    // Re-evaluate alerts after stock deduction
    checkProductAlert(sale.itemId).catch(console.error);

    res.json({ message: 'Dispatch recorded', sale });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/sales/summary
const getSalesSummary = async (req, res) => {
  try {
    const summary = await SalesOrder.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          totalOrders: { $sum: 1 },
          totalQtyOrdered: { $sum: '$quantityOrdered' },
          totalQtyDispatched: { $sum: '$quantityDispatched' },
        },
      },
    ]);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getSales, getSale, createSale, updateSale, deleteSale, dispatchSale, getSalesSummary };
