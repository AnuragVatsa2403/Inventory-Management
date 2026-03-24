const SalesOrder = require('../models/SalesOrder');
const Product    = require('../models/Product');

// ── Indian states list ────────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli',
  'Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

// ── HSN codes for plastics ────────────────────────────────────
const PLASTIC_HSN = [
  { code: '3901', desc: 'Polymers of ethylene (HDPE, LDPE, LLDPE)',   rate: 18 },
  { code: '3902', desc: 'Polymers of propylene (PP Homopolymer/Copo)', rate: 18 },
  { code: '3904', desc: 'Polymers of vinyl chloride (PVC)',            rate: 18 },
  { code: '3906', desc: 'Acrylic polymers (PMMA, ABS)',                rate: 18 },
  { code: '3907', desc: 'Polyacetals, polyesters (PET)',               rate: 18 },
  { code: '3920', desc: 'Plastic sheets, film, foil',                  rate: 18 },
  { code: '3917', desc: 'Plastic pipes and tubes',                     rate: 18 },
  { code: '3923', desc: 'Plastic bags, BOPP bags, packaging',          rate: 12 },
  { code: '3919', desc: 'Adhesive plates, film, stretch film',         rate: 18 },
  { code: '3812', desc: 'Prepared plasticisers, stabilisers (additives)', rate: 18 },
  { code: '2811', desc: 'Calcium carbonate, fillers',                  rate: 5  },
];

// ── Calculate GST for a sales order ───────────────────────────
const calculateGST = (taxableValue, gstRate, sellerState, buyerState) => {
  const isIntrastate = sellerState?.toLowerCase() === buyerState?.toLowerCase();
  const totalTax     = +(taxableValue * gstRate / 100).toFixed(2);

  if (gstRate === 0) return {
    type: 'Exempt', rate: 0,
    taxableValue, cgst: 0, sgst: 0, igst: 0, totalTax: 0,
    totalValue: taxableValue,
  };

  if (isIntrastate) return {
    type:         'CGST+SGST',
    rate:         gstRate,
    taxableValue,
    cgst:         +(totalTax / 2).toFixed(2),
    sgst:         +(totalTax / 2).toFixed(2),
    igst:         0,
    totalTax,
    totalValue:   +(taxableValue + totalTax).toFixed(2),
  };

  return {
    type:         'IGST',
    rate:         gstRate,
    taxableValue,
    cgst:         0,
    sgst:         0,
    igst:         totalTax,
    totalTax,
    totalValue:   +(taxableValue + totalTax).toFixed(2),
  };
};

// ── GET /api/gst/hsn-codes ────────────────────────────────────
const getHSNCodes = (req, res) => {
  res.json(PLASTIC_HSN);
};

// ── GET /api/gst/states ───────────────────────────────────────
const getStates = (req, res) => {
  res.json(INDIAN_STATES);
};

// ── POST /api/gst/calculate ───────────────────────────────────
// Body: { quantity, unitPrice, gstRate, sellerState, buyerState }
const calculateGSTPreview = (req, res) => {
  try {
    const { quantity, unitPrice, gstRate, sellerState, buyerState } = req.body;
    if (!quantity || !unitPrice)
      return res.status(400).json({ message: 'quantity and unitPrice are required' });

    const taxableValue = +(quantity * unitPrice).toFixed(2);
    const rate         = gstRate ?? 18;
    const gst          = calculateGST(taxableValue, rate, sellerState || 'Haryana', buyerState || '');
    res.json({ gst });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/gst/apply/:saleId ───────────────────────────────
// Recalculate + save GST on an existing sales order
const applyGSTToOrder = async (req, res) => {
  try {
    const sale = await SalesOrder.findById(req.params.saleId).populate('itemId');
    if (!sale) return res.status(404).json({ message: 'Sales order not found' });

    const { buyerState, ewayBillNumber } = req.body;

    const gstRate      = sale.itemId?.gstRate ?? 18;
    const taxableValue = +(sale.quantityOrdered * sale.unitPrice).toFixed(2);
    const sellerState  = sale.sellerState || 'Haryana';
    const bState       = buyerState || sale.buyerState || '';

    const gst = calculateGST(taxableValue, gstRate, sellerState, bState);
    sale.gst       = gst;
    sale.buyerState = bState;

    // E-way bill — auto-flag if value > ₹50,000
    if (taxableValue > 50000 && ewayBillNumber) {
      sale.ewayBill = {
        number:      ewayBillNumber,
        generatedAt: new Date(),
        validUntil:  new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day validity per km
      };
    }

    await sale.save();
    res.json({ message: 'GST applied', gst: sale.gst, ewayBill: sale.ewayBill });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/gst/monthly-summary ─────────────────────────────
// Monthly GST summary for all sales — for tax filing
const monthlySummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = month ? parseInt(month) - 1 : new Date().getMonth();
    const y = year  ? parseInt(year)      : new Date().getFullYear();

    const start = new Date(y, m, 1);
    const end   = new Date(y, m + 1, 0, 23, 59, 59);

    const orders = await SalesOrder.find({
      saleDate: { $gte: start, $lte: end },
      'gst.totalTax': { $gt: 0 },
    }).populate('itemId', 'itemName hsnCode');

    const summary = {
      month:         `${start.toLocaleString('en-IN', { month: 'long' })} ${y}`,
      totalSales:    orders.length,
      totalTaxable:  0,
      totalCGST:     0,
      totalSGST:     0,
      totalIGST:     0,
      totalTax:      0,
      totalValue:    0,
      ewayBillCount: 0,
      orders:        [],
    };

    for (const o of orders) {
      const g = o.gst;
      summary.totalTaxable  += g.taxableValue  || 0;
      summary.totalCGST     += g.cgst          || 0;
      summary.totalSGST     += g.sgst          || 0;
      summary.totalIGST     += g.igst          || 0;
      summary.totalTax      += g.totalTax      || 0;
      summary.totalValue    += g.totalValue    || 0;
      if (o.ewayBill?.number) summary.ewayBillCount++;

      summary.orders.push({
        invoiceNo:    `INV-${String(o._id).slice(-8).toUpperCase()}`,
        date:         o.saleDate,
        customer:     o.customer?.name,
        buyerState:   o.buyerState,
        hsnCode:      o.itemId?.hsnCode,
        taxableValue: g.taxableValue,
        gstType:      g.type,
        cgst:         g.cgst,
        sgst:         g.sgst,
        igst:         g.igst,
        totalTax:     g.totalTax,
        totalValue:   g.totalValue,
        ewayBill:     o.ewayBill?.number || '—',
      });
    }

    // Round totals
    ['totalTaxable','totalCGST','totalSGST','totalIGST','totalTax','totalValue']
      .forEach(k => { summary[k] = +summary[k].toFixed(2); });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getHSNCodes, getStates, calculateGSTPreview, applyGSTToOrder, monthlySummary };
