const StockLedger = require('../models/StockLedger');
const Product     = require('../models/Product');
const Alert       = require('../models/Alert');


const runStockAlertScan = async () => {
  const results = { created: 0, resolved: 0, critical: 0, warnings: 0, scanned: 0 };

  const products = await Product.find({ isActive: true });
  results.scanned = products.length;

  for (const product of products) {
    const stock     = await StockLedger.getTotalAvailable(product._id);
    const available = stock.totalAvailable ?? 0;
    const threshold = product.lowStockThreshold ?? Number(process.env.LOW_STOCK_THRESHOLD) ?? 10;

    if (available === 0) {
      await upsertAlert({
        itemId: product._id, type: 'OUT_OF_STOCK', severity: 'critical',
        message: `${product.itemName} is completely out of stock.`,
        availableQty: 0, threshold,
      });
      results.critical++;

    } else if (available <= threshold) {
      const severity = available <= threshold / 2 ? 'critical' : 'warning';
      await upsertAlert({
        itemId: product._id, type: 'LOW_STOCK', severity,
        message: `${product.itemName} is running low — ${available} ${product.unit || 'T'} available (threshold: ${threshold}).`,
        availableQty: available, threshold,
      });
      if (severity === 'critical') results.critical++; else results.warnings++;

    } else {
      // Stock healthy — resolve open alerts
      const r = await Alert.updateMany(
        { itemId: product._id, isResolved: false },
        { isResolved: true, resolvedAt: new Date() }
      );
      results.resolved += r.modifiedCount;
    }
  }

  results.created = results.critical + results.warnings;
  return results;
};

/**
 * Targeted check for one product — called after GRN or dispatch.
 */
const checkProductAlert = async (itemId) => {
  const product = await Product.findById(itemId);
  if (!product) return;

  const stock     = await StockLedger.getTotalAvailable(itemId);
  const available = stock.totalAvailable ?? 0;
  const threshold = product.lowStockThreshold ?? 10;

  if (available === 0) {
    await upsertAlert({
      itemId, type: 'OUT_OF_STOCK', severity: 'critical',
      message: `${product.itemName} is completely out of stock.`,
      availableQty: 0, threshold,
    });
  } else if (available <= threshold) {
    await upsertAlert({
      itemId, type: 'LOW_STOCK',
      severity: available <= threshold / 2 ? 'critical' : 'warning',
      message: `${product.itemName} is running low — ${available} ${product.unit || 'T'} left (threshold: ${threshold}).`,
      availableQty: available, threshold,
    });
  } else {
    await Alert.updateMany(
      { itemId, isResolved: false },
      { isResolved: true, resolvedAt: new Date() }
    );
  }
};

const upsertAlert = async ({ itemId, type, severity, message, availableQty, threshold }) => {
  await Alert.findOneAndUpdate(
    { itemId, type, isResolved: false },
    { severity, message, availableQty, threshold, isRead: false, updatedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = { runStockAlertScan, checkProductAlert };
