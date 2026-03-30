const Supplier      = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const GoodsReceipt  = require('../models/GoodsReceipt');

const calcPerformance = async (supplierId) => {
  const orders = await PurchaseOrder.find({
    supplierId,
    status: { $in: ['Received', 'Partial'] },
  }).populate('items.itemId', 'itemName');

  if (!orders.length) return null;

  let onTime = 0, late = 0, totalQtyOrdered = 0, totalQtyReceived = 0;
  let totalValue = 0, totalQtyForPrice = 0;

  for (const o of orders) {
    // On-time: GRN received on or before expected delivery date
    if (o.expectedDeliveryDate) {
      const grn = await GoodsReceipt.findOne({ purchaseOrderId: o._id })
        .sort('receiptDate');
      if (grn) {
        grn.receiptDate <= o.expectedDeliveryDate ? onTime++ : late++;
      }
    }
    for (const item of o.items) {
      totalQtyOrdered  += item.quantityOrdered  || 0;
      totalQtyReceived += item.quantityReceived || 0;
      totalValue       += (item.quantityReceived || 0) * (item.unitPrice || 0);
      totalQtyForPrice += item.quantityReceived || 0;
    }
  }

  // Rejected GRNs
  const rejectedGRNs = await GoodsReceipt.find({
    purchaseOrderId: { $in: orders.map(o => o._id) },
    qualityStatus: 'Rejected',
  });
  const rejectedQty = rejectedGRNs.reduce((s, g) => s + g.quantityReceived, 0);

  // Score out of 10
  const onTimeScore    = orders.length ? (onTime / orders.length) * 4 : 4; // 40%
  const qtyAccuracy    = totalQtyOrdered ? (totalQtyReceived / totalQtyOrdered) * 3 : 3; // 30%
  const qualityScore   = totalQtyReceived ? ((totalQtyReceived - rejectedQty) / totalQtyReceived) * 3 : 3; // 30%
  const overallScore   = Math.min(10, +(onTimeScore + qtyAccuracy + qualityScore).toFixed(1));

  return {
    totalOrders:      orders.length,
    onTimeDeliveries: onTime,
    lateDeliveries:   late,
    totalQtyOrdered:  +totalQtyOrdered.toFixed(2),
    totalQtyReceived: +totalQtyReceived.toFixed(2),
    rejectedQty:      +rejectedQty.toFixed(2),
    avgPricePerTonne: totalQtyForPrice ? +(totalValue / totalQtyForPrice).toFixed(0) : 0,
    onTimeScore:      +onTimeScore.toFixed(1),
    qtyAccuracyScore: +qtyAccuracy.toFixed(1),
    qualityScore:     +qualityScore.toFixed(1),
    overallScore,
    lastUpdated:      new Date(),
  };
};

// ── GET /api/suppliers ────────────────────────────────────────
const getSuppliers = async (req, res) => {
  try {
    const { search, type } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { supplierName:    { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } },
        { supplierType:    { $regex: search, $options: 'i' } },
      ];
    }
    if (type) filter.supplierType = type;

    const suppliers = await Supplier.find(filter).sort('supplierName');
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/suppliers/:id ────────────────────────────────────
const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier || !supplier.isActive)
      return res.status(404).json({ message: 'Supplier not found' });

    // Attach last 5 purchase orders for this supplier
    const recentOrders = await PurchaseOrder.find({ supplierId: supplier._id })
      .populate('items.itemId', 'itemName unit')
      .sort('-orderDate')
      .limit(5);

    res.json({ ...supplier.toObject(), recentOrders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/suppliers ───────────────────────────────────────
const createSupplier = async (req, res) => {
  try {
    const { supplierName, supplierType, contactInfo, gstin, leadTimeDays, paymentTerms, supplyCategories } = req.body;

    if (!supplierName?.trim())
      return res.status(400).json({ message: 'Supplier name is required' });

    // Check for duplicate
    const exists = await Supplier.findOne({
      supplierName: { $regex: `^${supplierName.trim()}$`, $options: 'i' },
    });
    if (exists) return res.status(400).json({ message: `Supplier "${supplierName}" already exists` });

    const supplier = await Supplier.create({
      supplierName: supplierName.trim(),
      supplierType,
      contactInfo: {
        ...contactInfo,
        gstin: gstin || contactInfo?.gstin,
      },
      leadTimeDays: leadTimeDays ?? 7,
      paymentTerms,
      supplyCategories,
    });

    res.status(201).json(supplier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PUT /api/suppliers/:id ────────────────────────────────────
const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier || !supplier.isActive)
      return res.status(404).json({ message: 'Supplier not found' });

    const {
      supplierName, supplierType, contactInfo, gstin,
      leadTimeDays, paymentTerms, supplyCategories,
    } = req.body;

    if (supplierName)       supplier.supplierName    = supplierName.trim();
    if (supplierType)       supplier.supplierType    = supplierType;
    if (contactInfo)        supplier.contactInfo     = { ...supplier.contactInfo, ...contactInfo };
    if (gstin)              supplier.contactInfo.gstin = gstin;
    if (leadTimeDays != null) supplier.leadTimeDays  = leadTimeDays;
    if (paymentTerms)       supplier.paymentTerms    = paymentTerms;
    if (supplyCategories)   supplier.supplyCategories = supplyCategories;

    await supplier.save();
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /api/suppliers/:id — soft delete ───────────────────
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    // Check if supplier has any open (non-cancelled) POs
    const openPO = await PurchaseOrder.findOne({
      supplierId: supplier._id,
      status: { $in: ['Pending', 'Partial'] },
    });
    if (openPO)
      return res.status(400).json({
        message: 'Cannot deactivate — this supplier has open purchase orders',
      });

    supplier.isActive = false;
    await supplier.save();
    res.json({ message: `Supplier "${supplier.supplierName}" deactivated` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/suppliers/:id/performance ─────────────────────────
const getPerformance = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    const performance = await calcPerformance(supplier._id);
    if (!performance) return res.json({ message: 'No completed orders yet', performance: null });

    // Persist latest performance to supplier doc
    supplier.performance = performance;
    await supplier.save();

    res.json({ supplier: supplier.supplierName, performance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, getPerformance };
