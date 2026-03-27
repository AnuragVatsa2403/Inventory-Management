const ProductionEntry = require('../models/ProductionEntry');
const StockLedger     = require('../models/StockLedger');
const Product         = require('../models/Product');

// ── GET /api/production ───────────────────────────────────────
const getEntries = async (req, res) => {
  try {
    const { status, from, to, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (from || to) {
      filter.productionDate = {};
      if (from) filter.productionDate.$gte = new Date(from);
      if (to)   filter.productionDate.$lte = new Date(to);
    }
    const entries = await ProductionEntry.find(filter)
      .populate('rawMaterials.itemId',   'itemName unit polymerGrade')
      .populate('finishedGoods.itemId',  'itemName unit polymerGrade')
      .populate('createdBy', 'name')
      .sort('-productionDate')
      .limit(Number(limit));

    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/production/:id ───────────────────────────────────
const getEntry = async (req, res) => {
  try {
    const entry = await ProductionEntry.findById(req.params.id)
      .populate('rawMaterials.itemId',  'itemName unit polymerGrade itemType hsnCode')
      .populate('finishedGoods.itemId', 'itemName unit polymerGrade itemType hsnCode')
      .populate('createdBy', 'name');
    if (!entry) return res.status(404).json({ message: 'Production entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/production ──────────────────────────────────────
const createEntry = async (req, res) => {
  try {
    const {
      batchCode, productionDate, shift, rawMaterials, finishedGoods,
      machineId, processType, operatorName, supervisorName, notes, wastageReason,
    } = req.body;

    if (!batchCode)            return res.status(400).json({ message: 'Batch code is required' });
    if (!rawMaterials?.length) return res.status(400).json({ message: 'At least one raw material is required' });
    if (!finishedGoods?.length)return res.status(400).json({ message: 'At least one finished good is required' });

    // Validate raw material quantities
    for (const rm of rawMaterials) {
      if (!rm.itemId || !rm.quantityUsed || rm.quantityUsed <= 0)
        return res.status(400).json({ message: 'Each raw material must have a product and quantity > 0' });
    }

    // Check sufficient stock for each raw material
    for (const rm of rawMaterials) {
      const stock = await StockLedger.getTotalAvailable(rm.itemId);
      if (stock.totalAvailable < rm.quantityUsed) {
        const product = await Product.findById(rm.itemId);
        return res.status(400).json({
          message: `Insufficient stock for ${product?.itemName || rm.itemId}. Available: ${stock.totalAvailable} MT, Required: ${rm.quantityUsed} MT`,
        });
      }
    }

    const entry = await ProductionEntry.create({
      batchCode, productionDate, shift, rawMaterials, finishedGoods,
      machineId, processType, operatorName, supervisorName, notes,
      wastage: { reason: wastageReason },
      createdBy: req.user?._id,
      status: 'Draft',
    });

    res.status(201).json(entry);
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: `Batch code "${req.body.batchCode}" already exists` });
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/production/:id/complete ────────────────────────
// This is the key action — deducts raw material stock, credits finished goods stock
const completeProduction = async (req, res) => {
  try {
    const entry = await ProductionEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Production entry not found' });
    if (entry.status === 'Completed')
      return res.status(400).json({ message: 'Production already completed' });
    if (entry.status === 'Cancelled')
      return res.status(400).json({ message: 'Cannot complete a cancelled entry' });

    // ── Deduct raw materials from stock ──────────────────────
    for (const rm of entry.rawMaterials) {
      // Find ledger entries for this product, deduct from oldest batch first (FIFO)
      const ledgers = await StockLedger.find({ itemId: rm.itemId })
        .sort('createdAt');

      let remaining = rm.quantityUsed;
      for (const ledger of ledgers) {
        if (remaining <= 0) break;
        const available = ledger.quantityOnHand - ledger.reservedQuantity;
        const deduct    = Math.min(available, remaining);
        ledger.quantityOnHand = Math.max(0, ledger.quantityOnHand - deduct);
        await ledger.save();
        remaining -= deduct;
      }
    }

    // ── Credit finished goods to stock ───────────────────────
    for (const fg of entry.finishedGoods) {
      // Find or create a ledger entry for the finished good
      let ledger = await StockLedger.findOne({
        itemId:      fg.itemId,
        batchNumber: fg.batchNumber || entry.batchCode,
      });

      if (ledger) {
        ledger.quantityOnHand += fg.quantityProduced;
      } else {
        ledger = new StockLedger({
          itemId:         fg.itemId,
          batchNumber:    fg.batchNumber || entry.batchCode,
          quantityOnHand: fg.quantityProduced,
          department:     'Finished Goods',
        });
      }
      await ledger.save();
    }

    entry.status = 'Completed';
    await entry.save();

    await entry.populate('rawMaterials.itemId',  'itemName unit');
    await entry.populate('finishedGoods.itemId', 'itemName unit');

    res.json({
      message:    'Production completed — stock updated',
      entry,
      summary: {
        totalRawMaterialUsed: entry.rawMaterials.reduce((s, r) => s + r.quantityUsed, 0),
        totalFinishedGoods:   entry.finishedGoods.reduce((s, g) => s + g.quantityProduced, 0),
        wastage:              entry.wastage,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PUT /api/production/:id/cancel ───────────────────────────
const cancelEntry = async (req, res) => {
  try {
    const entry = await ProductionEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Production entry not found' });
    if (entry.status === 'Completed')
      return res.status(400).json({ message: 'Cannot cancel a completed production entry' });
    entry.status = 'Cancelled';
    await entry.save();
    res.json({ message: 'Production entry cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/production/stats ─────────────────────────────────
// Wastage stats for dashboard
const getStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const entries = await ProductionEntry.find({
      status:         'Completed',
      productionDate: { $gte: from },
    }).populate('rawMaterials.itemId', 'itemName');

    const totalRaw      = entries.reduce((s, e) => s + e.rawMaterials.reduce((a, r) => a + r.quantityUsed, 0), 0);
    const totalFinished = entries.reduce((s, e) => s + e.finishedGoods.reduce((a, g) => a + g.quantityProduced, 0), 0);
    const totalWastage  = entries.reduce((s, e) => s + e.wastage.quantity, 0);
    const avgYield      = totalRaw > 0 ? +((totalFinished / totalRaw) * 100).toFixed(1) : 0;

    // Wastage by process type
    const byProcess = {};
    for (const e of entries) {
      const pt = e.processType || 'Other';
      if (!byProcess[pt]) byProcess[pt] = { count: 0, totalWastage: 0, totalRaw: 0 };
      byProcess[pt].count++;
      byProcess[pt].totalWastage += e.wastage.quantity;
      byProcess[pt].totalRaw     += e.rawMaterials.reduce((a, r) => a + r.quantityUsed, 0);
    }

    res.json({
      period:         `Last ${days} days`,
      totalBatches:   entries.length,
      totalRawUsed:   +totalRaw.toFixed(2),
      totalFinished:  +totalFinished.toFixed(2),
      totalWastage:   +totalWastage.toFixed(2),
      avgYieldPct:    avgYield,
      avgWastagePct:  totalRaw > 0 ? +(100 - avgYield).toFixed(1) : 0,
      byProcess,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getEntries, getEntry, createEntry, completeProduction, cancelEntry, getStats };
