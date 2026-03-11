const PurchaseOrder        = require('../models/PurchaseOrder');
const Product              = require('../models/Product');
const Supplier             = require('../models/Supplier');
const StockLedger          = require('../models/StockLedger');
const { sendReorderEmail } = require('./emailService');

const REORDER_MULTIPLIER = 3;

const runReorderAutomation = async () => {
  const results = { checked: 0, created: 0, skipped: 0, errors: 0, orders: [] };

  try {
    const lowStockItems = await StockLedger.getLowStockItems();
    results.checked = lowStockItems.length;

    for (const item of lowStockItems) {
      try {
        const product = item.product;
        if (!product) { results.skipped++; continue; }


        const existingPO = await PurchaseOrder.findOne({
          'items.itemId': product._id,
          status: { $in: ['Pending', 'Partial'] },
        });
        if (existingPO) { results.skipped++; continue; }

     
        const supplier = await Supplier.findOne({ isActive: true }).sort('leadTimeDays');
        if (!supplier) { results.skipped++; continue; }

        const qty = Math.max(product.lowStockThreshold * REORDER_MULTIPLIER, 1);

        const po = await PurchaseOrder.create({
          supplierId: supplier._id,
          orderDate:  new Date(),
          status:     'Pending',
          notes:      `Auto-reorder — ${product.itemName} at ${item.totalAvailable} ${product.unit || 'T'} (threshold: ${product.lowStockThreshold})`,
          items: [{
            itemId: product._id, quantityOrdered: qty,
            quantityReceived: 0, unitPrice: 0,
          }],
        });

        results.orders.push({
          poId: po._id, product: product.itemName,
          supplier: supplier.supplierName, quantity: qty,
        });
        results.created++;
      } catch (err) {
        console.error(`[Reorder] Error:`, err.message);
        results.errors++;
      }
    }

    if (results.orders.length > 0) {
      sendReorderEmail(results.orders).catch(console.error);
    }
  } catch (err) {
    console.error('[Reorder] Automation error:', err.message);
  }

  return results;
};

module.exports = { runReorderAutomation };
