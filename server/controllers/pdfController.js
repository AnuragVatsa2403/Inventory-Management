const SalesOrder   = require('../models/SalesOrder');
const GoodsReceipt = require('../models/GoodsReceipt');
const { generateInvoice, generateGRN } = require('../services/pdfService');

// GET /api/pdf/invoice/:saleId
const downloadInvoice = async (req, res) => {
  try {
    const sale = await SalesOrder.findById(req.params.saleId)
      .populate('itemId', 'itemName itemType unit polymerGrade department');

    if (!sale) return res.status(404).json({ message: 'Sale order not found' });

    generateInvoice(res, sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/pdf/grn/:grnId
const downloadGRN = async (req, res) => {
  try {
    const grn = await GoodsReceipt.findById(req.params.grnId)
      .populate('itemId', 'itemName itemType unit polymerGrade department')
      .populate({
        path: 'purchaseOrderId',
        populate: { path: 'supplierId', select: 'supplierName contactInfo' },
      })
      .populate('receivedBy', 'name');

    if (!grn) return res.status(404).json({ message: 'GRN not found' });

    generateGRN(res, grn);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { downloadInvoice, downloadGRN };
