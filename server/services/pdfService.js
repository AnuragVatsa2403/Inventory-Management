const PDFDocument = require('pdfkit');

// ── Polytime brand colors ──────────────────────────────────────
const C = {
  bg:      '#080d16',
  surface: '#0f172a',
  card:    '#1e293b',
  accent:  '#0ea5e9',
  accent2: '#38bdf8',
  text:    '#f1f5f9',
  muted:   '#64748b',
  border:  '#1e293b',
  green:   '#22c55e',
  red:     '#ef4444',
  amber:   '#f59e0b',
};

// ── Helpers ────────────────────────────────────────────────────
const drawHeader = (doc, title, subtitle, refNo) => {
  // Background
  doc.rect(0, 0, doc.page.width, 85).fill(C.surface);
  // Accent left bar
  doc.rect(0, 0, 4, 85).fill(C.accent);

  // SH logo box
  doc.roundedRect(28, 18, 42, 42, 6).fill(C.accent);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15)
     .text('SH', 28, 31, { width: 42, align: 'center' });

  // Title + subtitle
  doc.fillColor(C.text).font('Helvetica-Bold').fontSize(18)
     .text(title, 82, 20);
  doc.fillColor(C.muted).font('Helvetica').fontSize(8)
     .text('POLYTIME INDUSTRIES  ·  ' + subtitle.toUpperCase(), 82, 42, { characterSpacing: 1.2 });

  // Ref number right
  doc.fillColor(C.muted).font('Helvetica').fontSize(9)
     .text(refNo, doc.page.width - 190, 25, { width: 160, align: 'right' });
  doc.fillColor(C.muted).font('Helvetica').fontSize(8)
     .text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
       doc.page.width - 190, 42, { width: 160, align: 'right' });

  doc.moveDown(3);
};

const drawSectionLabel = (doc, label) => {
  const y = doc.y;
  doc.rect(30, y, doc.page.width - 60, 22).fill(C.card);
  doc.rect(30, y, 3, 22).fill(C.accent);
  doc.fillColor(C.muted).font('Helvetica').fontSize(8)
     .text(label.toUpperCase(), 42, y + 7, { characterSpacing: 1.5 });
  doc.y = y + 28;
};

const drawInfoRow = (doc, label, value, x = 40, y = null) => {
  const ry = y ?? doc.y;
  doc.fillColor(C.muted).font('Helvetica').fontSize(9).text(label, x, ry, { width: 120 });
  doc.fillColor(C.text).font('Helvetica-Bold').fontSize(9).text(String(value || '—'), x + 125, ry, { width: 200 });
  doc.y = ry + 17;
};

const drawTableHeader = (doc, columns) => {
  const y = doc.y;
  doc.rect(30, y, doc.page.width - 60, 24).fill(C.card);
  let x = 40;
  columns.forEach(col => {
    doc.fillColor(C.muted).font('Helvetica').fontSize(8)
       .text(col.label.toUpperCase(), x, y + 8, { width: col.width, align: col.align || 'left', characterSpacing: 1 });
    x += col.width;
  });
  doc.y = y + 30;
};

const drawTableRow = (doc, columns, values, isOdd) => {
  const y   = doc.y;
  const rowH = 24;
  if (isOdd) doc.rect(30, y, doc.page.width - 60, rowH).fill('#0d1424');
  doc.rect(30, y + rowH - 1, doc.page.width - 60, 1).fill(C.border);
  let x = 40;
  columns.forEach((col, i) => {
    const val   = values[i] ?? '—';
    const color = col.color ? col.color(val) : C.text;
    doc.fillColor(color)
       .font(col.bold ? 'Helvetica-Bold' : 'Helvetica')
       .fontSize(9)
       .text(String(val), x, y + 8, { width: col.width - 6, align: col.align || 'left' });
    x += col.width;
  });
  doc.y = y + rowH;
};

const drawFooter = (doc) => {
  const y = doc.page.height - 52;
  doc.rect(0, y, doc.page.width, 52).fill(C.surface);
  doc.rect(0, y, doc.page.width, 1).fill(C.border);
  doc.fillColor(C.muted).font('Helvetica').fontSize(8)
     .text(
       `StockHive · Polytime Industries · Generated ${new Date().toLocaleString('en-IN')}`,
       30, y + 19, { align: 'center', width: doc.page.width - 60 }
     );
};

// ── Sales Invoice ──────────────────────────────────────────────
const generateInvoice = (res, sale) => {
  const doc = new PDFDocument({ size: 'A4', margin: 30, bufferPages: true });
  doc.pipe(res);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${String(sale._id).slice(-8).toUpperCase()}.pdf"`);

  // Full page background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.bg);

  const refNo = `INV-${String(sale._id).slice(-8).toUpperCase()}`;
  drawHeader(doc, 'Sales Invoice', 'Inventory Management System', refNo);

  // ── Invoice details ─────────────────────────────────────────
  drawSectionLabel(doc, 'Invoice Details');
  const col2x  = doc.page.width / 2 + 10;
  const startY = doc.y;

  // Left column
  drawInfoRow(doc, 'Invoice No.',  refNo,                                        40, startY);
  drawInfoRow(doc, 'Sale Date',    new Date(sale.saleDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }), 40);
  drawInfoRow(doc, 'Payment',      sale.paymentStatus,                           40);
  drawInfoRow(doc, 'Dispatch',     sale.dispatchStatus,                          40);

  // Right column — customer
  if (sale.customer?.name) {
    drawInfoRow(doc, 'Customer',   sale.customer.name,              col2x, startY);
    drawInfoRow(doc, 'GSTIN',      sale.customer.gstin  || '—',     col2x);
    drawInfoRow(doc, 'Phone',      sale.customer.phone  || '—',     col2x);
    drawInfoRow(doc, 'Email',      sale.customer.email  || '—',     col2x);
    if (sale.customer.address)
      drawInfoRow(doc, 'Address',  sale.customer.address,           col2x);
  }

  doc.y = startY + 80;

  // ── Material / item table ───────────────────────────────────
  drawSectionLabel(doc, 'Material Details');
  const itemCols = [
    { label: 'Material / Grade', width: 190, bold: true },
    { label: 'Type',             width: 100 },
    { label: 'Polymer',          width: 80  },
    { label: 'Unit',             width: 60  },
    { label: 'Ordered (T)',      width: 75, align: 'right' },
    { label: 'Dispatched (T)',   width: 80, align: 'right',
      color: (v) => Number(v) > 0 ? C.green : C.muted },
  ];
  drawTableHeader(doc, itemCols);
  const item = sale.itemId;
  drawTableRow(doc, itemCols, [
    item?.itemName    || 'N/A',
    item?.itemType    || '—',
    item?.polymerGrade || '—',
    item?.unit        || 'Tonnes',
    sale.quantityOrdered,
    sale.quantityDispatched,
  ], false);

  // ── Summary ─────────────────────────────────────────────────
  doc.moveDown(1.2);
  drawSectionLabel(doc, 'Summary');
  const remaining = sale.quantityOrdered - sale.quantityDispatched;
  drawInfoRow(doc, 'Total Ordered',     `${sale.quantityOrdered} ${item?.unit || 'T'}`);
  drawInfoRow(doc, 'Total Dispatched',  `${sale.quantityDispatched} ${item?.unit || 'T'}`);
  drawInfoRow(doc, 'Remaining',         `${remaining} ${item?.unit || 'T'}`);
  if (sale.unitPrice) {
    drawInfoRow(doc, 'Unit Price',      `₹${sale.unitPrice.toLocaleString('en-IN')} / T`);
    const taxableValue = sale.quantityOrdered * sale.unitPrice;
    drawInfoRow(doc, 'Taxable Value',   `₹${taxableValue.toLocaleString('en-IN')}`);
  }

  // ── GST breakdown ───────────────────────────────────────────
  if (sale.gst?.totalTax > 0) {
    doc.moveDown(0.5);
    drawSectionLabel(doc, 'GST Details');
    const g = sale.gst;
    drawInfoRow(doc, 'GST Type',        g.type || '—');
    drawInfoRow(doc, 'GST Rate',        `${g.rate}%`);
    drawInfoRow(doc, 'Taxable Value',   `₹${(g.taxableValue||0).toLocaleString('en-IN')}`);
    if (g.type === 'CGST+SGST') {
      drawInfoRow(doc, `CGST (${g.rate/2}%)`, `₹${(g.cgst||0).toLocaleString('en-IN')}`);
      drawInfoRow(doc, `SGST (${g.rate/2}%)`, `₹${(g.sgst||0).toLocaleString('en-IN')}`);
    } else {
      drawInfoRow(doc, `IGST (${g.rate}%)`,   `₹${(g.igst||0).toLocaleString('en-IN')}`);
    }
    drawInfoRow(doc, 'Total Tax',       `₹${(g.totalTax||0).toLocaleString('en-IN')}`);
    // Grand total highlight
    const gtY = doc.y + 4;
    doc.rect(30, gtY, doc.page.width - 60, 28).fill(C.card);
    doc.fillColor(C.muted).font('Helvetica').fontSize(9).text('GRAND TOTAL (incl. GST)', 40, gtY + 8, { width: 200 });
    doc.fillColor(C.accent).font('Helvetica-Bold').fontSize(12)
       .text(`₹${(g.totalValue||0).toLocaleString('en-IN')}`, 40, gtY + 7, { width: doc.page.width - 80, align: 'right' });
    doc.y = gtY + 38;
  }

  // ── E-way bill ──────────────────────────────────────────────
  if (sale.ewayBill?.number) {
    doc.moveDown(0.5);
    drawSectionLabel(doc, 'E-Way Bill');
    drawInfoRow(doc, 'E-Way Bill No.',  sale.ewayBill.number);
    if (sale.ewayBill.generatedAt)
      drawInfoRow(doc, 'Generated On',  new Date(sale.ewayBill.generatedAt).toLocaleDateString('en-IN'));
    if (sale.ewayBill.validUntil)
      drawInfoRow(doc, 'Valid Until',   new Date(sale.ewayBill.validUntil).toLocaleDateString('en-IN'));
  }

  drawFooter(doc);
  doc.end();
};

// ── GRN (Goods Receipt Note) ───────────────────────────────────
const generateGRN = (res, grn) => {
  const doc = new PDFDocument({ size: 'A4', margin: 30, bufferPages: true });
  doc.pipe(res);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="grn-${String(grn._id).slice(-8).toUpperCase()}.pdf"`);

  doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.bg);

  const refNo = `GRN-${String(grn._id).slice(-8).toUpperCase()}`;
  drawHeader(doc, 'Goods Receipt Note', 'Raw Material Inward · Polytime Industries', refNo);

  // ── Receipt details ─────────────────────────────────────────
  drawSectionLabel(doc, 'Receipt Details');
  const col2x  = doc.page.width / 2 + 10;
  const startY = doc.y;

  const supplier = grn.purchaseOrderId?.supplierId;
  const poRef    = grn.purchaseOrderId
    ? `PO-${String(grn.purchaseOrderId._id || grn.purchaseOrderId).slice(-8).toUpperCase()}`
    : '—';

  // Left
  drawInfoRow(doc, 'GRN Number',    refNo,                                              40, startY);
  drawInfoRow(doc, 'Receipt Date',  new Date(grn.receiptDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }), 40);
  drawInfoRow(doc, 'Batch / LOT',   grn.batchNumber || '—',                            40);
  drawInfoRow(doc, 'Vehicle No.',   grn.vehicleNumber || '—',                           40);
  drawInfoRow(doc, 'Quality',       grn.qualityStatus || 'Pending QC',                 40);

  // Right
  drawInfoRow(doc, 'PO Reference',  poRef,                                             col2x, startY);
  drawInfoRow(doc, 'Supplier',      supplier?.supplierName || '—',                     col2x);
  if (supplier?.contactInfo?.gstin)
    drawInfoRow(doc, 'GSTIN',       supplier.contactInfo.gstin,                        col2x);

  doc.y = startY + 92;

  // ── Material table ──────────────────────────────────────────
  drawSectionLabel(doc, 'Received Material');
  const grnCols = [
    { label: 'Material / Grade', width: 200, bold: true },
    { label: 'Type',             width: 110 },
    { label: 'Polymer',          width: 90  },
    { label: 'Unit',             width: 65  },
    { label: 'Qty Received (T)', width: 100, align: 'right', color: () => C.green },
  ];
  drawTableHeader(doc, grnCols);
  const item = grn.itemId;
  drawTableRow(doc, grnCols, [
    item?.itemName     || 'N/A',
    item?.itemType     || '—',
    item?.polymerGrade || '—',
    item?.unit         || 'Tonnes',
    grn.quantityReceived,
  ], false);

  // ── Signature / verification boxes ─────────────────────────
  doc.moveDown(2);
  drawSectionLabel(doc, 'Verification & Sign-off');
  const sigY = doc.y + 8;
  const sigW = 150;
  const gap  = 25;

  [['Received By', 30], ['QC Checked By', 30 + sigW + gap], ['Approved By', 30 + (sigW + gap) * 2]].forEach(([label, x]) => {
    doc.rect(x, sigY, sigW, 55).stroke(C.border);
    doc.fillColor(C.muted).font('Helvetica').fontSize(8)
       .text(label, x, sigY + 60, { width: sigW, align: 'center' });
  });

  if (grn.notes) {
    doc.y = sigY + 80;
    drawInfoRow(doc, 'Notes', grn.notes);
  }

  drawFooter(doc);
  doc.end();
};

module.exports = { generateInvoice, generateGRN };
