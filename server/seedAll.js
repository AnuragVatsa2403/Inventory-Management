/**
 * seedAll.js — Full 6-month dataset for StockHive / Polytime Industries
 * Usage: node seedAll.js
 * WARNING: Clears existing data (except users) before seeding
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Models ────────────────────────────────────────────────────
const User            = require('./models/User');
const Category        = require('./models/Category');
const Supplier        = require('./models/Supplier');
const Product         = require('./models/Product');
const PurchaseOrder   = require('./models/PurchaseOrder');
const GoodsReceipt    = require('./models/GoodsReceipt');
const StockLedger     = require('./models/StockLedger');
const SalesOrder      = require('./models/SalesOrder');
const ProductionEntry = require('./models/ProductionEntry');
const Alert           = require('./models/Alert');

const log  = (msg) => console.log(`  ✓ ${msg}`);
const warn = (msg) => console.log(`  ⚠ ${msg}`);

// ── Date helpers ──────────────────────────────────────────────
const daysAgo  = (n) => new Date(Date.now() - n * 86400000);
const date     = (y, m, d) => new Date(y, m - 1, d);

// ── Main ──────────────────────────────────────────────────────
async function seed() {
  try {
    console.log('\n  StockHive Full Dataset Seed');
    console.log('  ════════════════════════════\n');
    console.log('  Connecting to MongoDB…');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('  ✓ Connected\n');

    // ── Clear existing data (keep users) ─────────────────────
    console.log('  Clearing existing data…');
    await Promise.all([
      Category.deleteMany({}),
      Supplier.deleteMany({}),
      Product.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      GoodsReceipt.deleteMany({}),
      StockLedger.deleteMany({}),
      SalesOrder.deleteMany({}),
      ProductionEntry.deleteMany({}),
      Alert.deleteMany({}),
    ]);
    log('Cleared all collections');

    // ════════════════════════════════════════════════════════
    // 1. USERS
    // ════════════════════════════════════════════════════════
    console.log('\n  [1/8] Users');
    const usersData = [
      { name: 'Anurag Vatsa',  email: 'admin@polytime.in',   password: 'Admin1234',   role: 'admin',   department: 'Management' },
      { name: 'Amit Rathod',   email: 'manager@polytime.in', password: 'Manager1234', role: 'manager', department: 'Management' },
      { name: 'Rajesh Kumar',  email: 'orders@polytime.in',  password: 'Orders1234',  role: 'orders',  department: 'Purchase' },
      { name: 'Priya Sharma',  email: 'sales@polytime.in',   password: 'Sales1234',   role: 'sales',   department: 'Sales' },
      { name: 'Suresh Patel',  email: 'staff@polytime.in',   password: 'Staff1234',   role: 'staff',   department: 'Warehouse' },
    ];
    const users = {};
    for (const u of usersData) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.create(u);
        log(`Created user: ${u.name} (${u.role})`);
      } else {
        warn(`User exists: ${u.email}`);
      }
      users[u.role] = user;
    }

    // ════════════════════════════════════════════════════════
    // 2. CATEGORIES
    // ════════════════════════════════════════════════════════
    console.log('\n  [2/8] Categories');
    const categoriesData = [
      { name: 'Polymer Grades',        description: 'HDPE, LDPE, PP, PVC raw polymer granules' },
      { name: 'Raw Materials',         description: 'Base raw materials for plastic manufacturing' },
      { name: 'Finished Goods',        description: 'Manufactured plastic products ready for dispatch' },
      { name: 'Packaging Material',    description: 'BOPP bags, stretch film, corrugated boxes' },
      { name: 'Chemicals & Additives', description: 'Calcium carbonate, masterbatch, stabilisers' },
    ];
    const cats = {};
    for (const c of categoriesData) {
      const cat = await Category.create(c);
      cats[c.name] = cat;
      log(`Category: ${c.name}`);
    }

    // ════════════════════════════════════════════════════════
    // 3. SUPPLIERS
    // ════════════════════════════════════════════════════════
    console.log('\n  [3/8] Suppliers');
    const suppliersData = [
      {
        supplierName: 'Reliance Industries Ltd',
        supplierType: 'Petrochemical Manufacturer',
        contactInfo:  { email: 'purchase@ril.com', phone: '+91-22-3555-5000', address: 'Mumbai, Maharashtra', gstin: '27AAACR5055K1ZZ' },
        leadTimeDays: 7, paymentTerms: 'Net-30',
        supplyCategories: ['HDPE', 'LDPE', 'PP'],
      },
      {
        supplierName: 'GAIL Polymers',
        supplierType: 'Petrochemical Manufacturer',
        contactInfo:  { email: 'sales@gail.com', phone: '+91-11-2373-0000', address: 'New Delhi', gstin: '07AABCG0322K1ZT' },
        leadTimeDays: 10, paymentTerms: 'Net-45',
        supplyCategories: ['PP', 'HDPE'],
      },
      {
        supplierName: 'Supreme Petrochem',
        supplierType: 'Polymer Distributor',
        contactInfo:  { email: 'info@supremepetrochem.com', phone: '+91-22-6631-4444', address: 'Mumbai, Maharashtra', gstin: '27AAECS6764K1ZP' },
        leadTimeDays: 5, paymentTerms: 'Net-15',
        supplyCategories: ['LDPE', 'Packaging'],
      },
      {
        supplierName: 'Haldia Petrochemicals',
        supplierType: 'Petrochemical Manufacturer',
        contactInfo:  { email: 'sales@hpcl.com', phone: '+91-3224-252000', address: 'Haldia, West Bengal', gstin: '19AAACH1234K1ZX' },
        leadTimeDays: 14, paymentTerms: 'Net-60',
        supplyCategories: ['PVC', 'HDPE'],
      },
      {
        supplierName: 'Omya India Pvt Ltd',
        supplierType: 'Masterbatch Supplier',
        contactInfo:  { email: 'info@omya.in', phone: '+91-124-4700-700', address: 'Gurugram, Haryana', gstin: '06AABCO1234K1ZY' },
        leadTimeDays: 3, paymentTerms: 'Net-15',
        supplyCategories: ['Calcium Carbonate', 'Additives'],
      },
    ];
    const suppliers = {};
    for (const s of suppliersData) {
      const sup = await Supplier.create(s);
      suppliers[s.supplierName] = sup;
      log(`Supplier: ${s.supplierName}`);
    }

    // ════════════════════════════════════════════════════════
    // 4. PRODUCTS
    // ════════════════════════════════════════════════════════
    console.log('\n  [4/8] Products');
    const productsData = [
      // Raw Materials
      { itemName: 'HDPE Granules',      itemType: 'Raw Material',   polymerGrade: 'HDPE',           unit: 'Tonnes', category: cats['Polymer Grades']._id,        lowStockThreshold: 5,   hsnCode: '3901', gstRate: 18, batchNumber: 'LOT-HDPE-202503-001',  department: 'Raw Materials' },
      { itemName: 'LDPE Granules',      itemType: 'Raw Material',   polymerGrade: 'LDPE',           unit: 'Tonnes', category: cats['Polymer Grades']._id,        lowStockThreshold: 3,   hsnCode: '3901', gstRate: 18, batchNumber: 'LOT-LDPE-202503-001',  department: 'Raw Materials' },
      { itemName: 'PP Granules',        itemType: 'Raw Material',   polymerGrade: 'PP Homopolymer', unit: 'Tonnes', category: cats['Polymer Grades']._id,        lowStockThreshold: 4,   hsnCode: '3902', gstRate: 18, batchNumber: 'LOT-PP-202503-001',    department: 'Raw Materials' },
      { itemName: 'PVC Resin',          itemType: 'Raw Material',   polymerGrade: 'PVC',            unit: 'Tonnes', category: cats['Raw Materials']._id,         lowStockThreshold: 2,   hsnCode: '3904', gstRate: 18, batchNumber: 'LOT-PVC-202503-001',   department: 'Raw Materials' },
      { itemName: 'Calcium Carbonate',  itemType: 'Raw Material',   polymerGrade: 'Other',          unit: 'Tonnes', category: cats['Chemicals & Additives']._id, lowStockThreshold: 1,   hsnCode: '2811', gstRate: 5,  batchNumber: 'LOT-CACO-202503-001',  department: 'Raw Materials' },
      // Finished Goods
      { itemName: 'Plastic Pipes 20mm', itemType: 'Finished Goods', polymerGrade: 'HDPE',           unit: 'Tonnes', category: cats['Finished Goods']._id,        lowStockThreshold: 2,   hsnCode: '3917', gstRate: 18, batchNumber: 'FG-PP20-202503-001',   department: 'Finished Goods' },
      { itemName: 'Plastic Pipes 32mm', itemType: 'Finished Goods', polymerGrade: 'HDPE',           unit: 'Tonnes', category: cats['Finished Goods']._id,        lowStockThreshold: 1.5, hsnCode: '3917', gstRate: 18, batchNumber: 'FG-PP32-202503-001',   department: 'Finished Goods' },
      { itemName: 'Plastic Sheets 4mm', itemType: 'Finished Goods', polymerGrade: 'PP Homopolymer', unit: 'Tonnes', category: cats['Finished Goods']._id,        lowStockThreshold: 1,   hsnCode: '3920', gstRate: 18, batchNumber: 'FG-PS4-202503-001',    department: 'Finished Goods' },
      // Packaging
      { itemName: 'BOPP Bags',          itemType: 'Packaging Material', polymerGrade: 'Other',      unit: 'Tonnes', category: cats['Packaging Material']._id,    lowStockThreshold: 0.5, hsnCode: '3923', gstRate: 12, batchNumber: 'LOT-BOPP-202503-001', department: 'Warehouse' },
      { itemName: 'Stretch Film Roll',  itemType: 'Packaging Material', polymerGrade: 'Other',      unit: 'Tonnes', category: cats['Packaging Material']._id,    lowStockThreshold: 0.5, hsnCode: '3919', gstRate: 18, batchNumber: 'LOT-SFR-202503-001',  department: 'Warehouse' },
    ];
    const products = {};
    for (const p of productsData) {
      const prod = await Product.create(p);
      products[p.itemName] = prod;
      log(`Product: ${p.itemName}`);
    }

    // ════════════════════════════════════════════════════════
    // 5. PURCHASE ORDERS + GRNs + STOCK LEDGER
    // ════════════════════════════════════════════════════════
    console.log('\n  [5/8] Purchase Orders + GRNs (6 months)');

    // Helper to create PO + GRN + stock credit
    const createPO = async (supplierId, items, orderDate, expectedDate, grnDate, grnOnTime = true) => {
      const po = await PurchaseOrder.create({
        supplierId,
        orderDate,
        expectedDeliveryDate: expectedDate,
        status: 'Pending',
        items: items.map(i => ({
          itemId:          i.product._id,
          quantityOrdered: i.qty,
          unitPrice:       i.price,
        })),
      });

      // Create GRN for each item
      for (const item of items) {
        const grn = await GoodsReceipt.create({
          purchaseOrderId:  po._id,
          itemId:           item.product._id,
          batchNumber:      item.product.batchNumber,
          quantityReceived: item.qty,
          receiptDate:      grnDate,
          receivedBy:       users['orders']._id,
          qualityStatus:    'Passed',
        });

        // Update PO item received qty
        po.items.find(i => i.itemId.toString() === item.product._id.toString()).quantityReceived = item.qty;

        // Credit stock ledger
        const existing = await StockLedger.findOne({ itemId: item.product._id, batchNumber: item.product.batchNumber });
        if (existing) {
          existing.quantityOnHand += item.qty;
          await existing.save();
        } else {
          await StockLedger.create({
            itemId:         item.product._id,
            batchNumber:    item.product.batchNumber,
            quantityOnHand: item.qty,
            department:     item.product.department,
          });
        }
      }

      po.status = 'Received';
      await po.save();
      return po;
    };

    // Oct 2025
    await createPO(suppliers['Reliance Industries Ltd']._id,
      [{ product: products['HDPE Granules'], qty: 25, price: 92000 },
       { product: products['LDPE Granules'], qty: 15, price: 85000 }],
      date(2025,10,5), date(2025,10,12), date(2025,10,11));
    log('PO: Reliance — Oct 2025');

    await createPO(suppliers['GAIL Polymers']._id,
      [{ product: products['PP Granules'], qty: 20, price: 80000 }],
      date(2025,10,8), date(2025,10,18), date(2025,10,20)); // late
    log('PO: GAIL — Oct 2025 (late delivery)');

    // Nov 2025
    await createPO(suppliers['Haldia Petrochemicals']._id,
      [{ product: products['PVC Resin'], qty: 12, price: 53000 }],
      date(2025,11,3), date(2025,11,17), date(2025,11,16));
    log('PO: Haldia — Nov 2025');

    await createPO(suppliers['Omya India Pvt Ltd']._id,
      [{ product: products['Calcium Carbonate'], qty: 8, price: 7500 }],
      date(2025,11,10), date(2025,11,13), date(2025,11,13));
    log('PO: Omya — Nov 2025');

    // Dec 2025
    await createPO(suppliers['Reliance Industries Ltd']._id,
      [{ product: products['HDPE Granules'], qty: 30, price: 93000 },
       { product: products['LDPE Granules'], qty: 18, price: 86000 }],
      date(2025,12,1), date(2025,12,8), date(2025,12,7));
    log('PO: Reliance — Dec 2025');

    await createPO(suppliers['Supreme Petrochem']._id,
      [{ product: products['BOPP Bags'], qty: 3, price: 95000 },
       { product: products['Stretch Film Roll'], qty: 2, price: 88000 }],
      date(2025,12,5), date(2025,12,10), date(2025,12,10));
    log('PO: Supreme — Dec 2025');

    // Jan 2026
    await createPO(suppliers['GAIL Polymers']._id,
      [{ product: products['PP Granules'], qty: 22, price: 81000 }],
      date(2026,1,6), date(2026,1,16), date(2026,1,15));
    log('PO: GAIL — Jan 2026');

    await createPO(suppliers['Haldia Petrochemicals']._id,
      [{ product: products['PVC Resin'], qty: 15, price: 54000 }],
      date(2026,1,10), date(2026,1,24), date(2026,1,26)); // late
    log('PO: Haldia — Jan 2026 (late delivery)');

    // Feb 2026
    await createPO(suppliers['Reliance Industries Ltd']._id,
      [{ product: products['HDPE Granules'], qty: 28, price: 94000 }],
      date(2026,2,3), date(2026,2,10), date(2026,2,9));
    log('PO: Reliance — Feb 2026');

    await createPO(suppliers['Omya India Pvt Ltd']._id,
      [{ product: products['Calcium Carbonate'], qty: 10, price: 7800 }],
      date(2026,2,8), date(2026,2,11), date(2026,2,11));
    log('PO: Omya — Feb 2026');

    // Mar 2026
    await createPO(suppliers['Reliance Industries Ltd']._id,
      [{ product: products['HDPE Granules'], qty: 30, price: 95000 },
       { product: products['LDPE Granules'], qty: 20, price: 88000 }],
      date(2026,3,2), date(2026,3,9), date(2026,3,9));
    log('PO: Reliance — Mar 2026');

    await createPO(suppliers['GAIL Polymers']._id,
      [{ product: products['PP Granules'], qty: 25, price: 82000 }],
      date(2026,3,5), date(2026,3,15), date(2026,3,14));
    log('PO: GAIL — Mar 2026');

    await createPO(suppliers['Haldia Petrochemicals']._id,
      [{ product: products['PVC Resin'], qty: 15, price: 55000 }],
      date(2026,3,8), date(2026,3,22), date(2026,3,21));
    log('PO: Haldia — Mar 2026');

    await createPO(suppliers['Omya India Pvt Ltd']._id,
      [{ product: products['Calcium Carbonate'], qty: 10, price: 8000 }],
      date(2026,3,10), date(2026,3,13), date(2026,3,13));
    log('PO: Omya — Mar 2026');

    // ════════════════════════════════════════════════════════
    // 6. PRODUCTION ENTRIES
    // ════════════════════════════════════════════════════════
    console.log('\n  [6/8] Production Entries');

    const createProduction = async (batchCode, prodDate, rawMats, finGoods, processType, shift, machineId, operator, supervisor, wastageReason) => {
      const entry = await ProductionEntry.create({
        batchCode, productionDate: prodDate,
        shift, processType, machineId, operatorName: operator, supervisorName: supervisor,
        rawMaterials:  rawMats.map(r  => ({ itemId: r.product._id, batchNumber: r.batch, quantityUsed: r.qty })),
        finishedGoods: finGoods.map(g => ({ itemId: g.product._id, batchNumber: g.batch, quantityProduced: g.qty })),
        wastage: { reason: wastageReason },
        createdBy: users['staff']._id,
        status: 'Draft',
      });

      // Complete production — deduct raw, credit finished
      for (const rm of rawMats) {
        const ledger = await StockLedger.findOne({ itemId: rm.product._id });
        if (ledger) {
          ledger.quantityOnHand = Math.max(0, ledger.quantityOnHand - rm.qty);
          await ledger.save();
        }
      }
      for (const fg of finGoods) {
        const existing = await StockLedger.findOne({ itemId: fg.product._id, batchNumber: fg.batch });
        if (existing) {
          existing.quantityOnHand += fg.qty;
          await existing.save();
        } else {
          await StockLedger.create({
            itemId: fg.product._id, batchNumber: fg.batch,
            quantityOnHand: fg.qty, department: 'Finished Goods',
          });
        }
      }

      entry.status = 'Completed';
      await entry.save();
      return entry;
    };

    // Oct-Nov 2025
    await createProduction('PROD-202510-001', date(2025,10,15),
      [{ product: products['HDPE Granules'], batch: 'LOT-HDPE-202503-001', qty: 8 },
       { product: products['Calcium Carbonate'], batch: 'LOT-CACO-202503-001', qty: 0.4 }],
      [{ product: products['Plastic Pipes 20mm'], batch: 'FG-PP20-202510-001', qty: 7.9 }],
      'Extrusion', 'Morning', 'EXT-01', 'Ramesh Kumar', 'Suresh Patel', 'Startup scrap');
    log('Production: PROD-202510-001 — HDPE → Pipes 20mm');

    await createProduction('PROD-202511-001', date(2025,11,10),
      [{ product: products['PP Granules'], batch: 'LOT-PP-202503-001', qty: 7 },
       { product: products['Calcium Carbonate'], batch: 'LOT-CACO-202503-001', qty: 0.3 }],
      [{ product: products['Plastic Pipes 32mm'], batch: 'FG-PP32-202511-001', qty: 6.9 }],
      'Extrusion', 'Afternoon', 'EXT-02', 'Vijay Singh', 'Suresh Patel', 'Die change scrap');
    log('Production: PROD-202511-001 — PP → Pipes 32mm');

    // Dec 2025
    await createProduction('PROD-202512-001', date(2025,12,12),
      [{ product: products['HDPE Granules'], batch: 'LOT-HDPE-202503-001', qty: 10 },
       { product: products['Calcium Carbonate'], batch: 'LOT-CACO-202503-001', qty: 0.5 }],
      [{ product: products['Plastic Pipes 20mm'], batch: 'FG-PP20-202512-001', qty: 9.8 }],
      'Extrusion', 'Morning', 'EXT-01', 'Ramesh Kumar', 'Amit Rathod', 'Startup scrap');
    log('Production: PROD-202512-001 — HDPE → Pipes 20mm');

    await createProduction('PROD-202512-002', date(2025,12,20),
      [{ product: products['PP Granules'], batch: 'LOT-PP-202503-001', qty: 6 },
       { product: products['Calcium Carbonate'], batch: 'LOT-CACO-202503-001', qty: 0.5 }],
      [{ product: products['Plastic Sheets 4mm'], batch: 'FG-PS4-202512-001', qty: 6.1 }],
      'Calendering', 'Morning', 'CAL-01', 'Deepak Verma', 'Amit Rathod', 'Edge trimming');
    log('Production: PROD-202512-002 — PP → Sheets 4mm');

    // Jan 2026
    await createProduction('PROD-202601-001', date(2026,1,18),
      [{ product: products['HDPE Granules'], batch: 'LOT-HDPE-202503-001', qty: 12 },
       { product: products['Calcium Carbonate'], batch: 'LOT-CACO-202503-001', qty: 0.6 }],
      [{ product: products['Plastic Pipes 20mm'], batch: 'FG-PP20-202601-001', qty: 11.8 }],
      'Extrusion', 'Morning', 'EXT-01', 'Ramesh Kumar', 'Suresh Patel', 'Startup scrap');
    log('Production: PROD-202601-001 — HDPE → Pipes 20mm');

    // Feb 2026
    await createProduction('PROD-202602-001', date(2026,2,14),
      [{ product: products['PP Granules'], batch: 'LOT-PP-202503-001', qty: 8 },
       { product: products['Calcium Carbonate'], batch: 'LOT-CACO-202503-001', qty: 0.3 }],
      [{ product: products['Plastic Pipes 32mm'], batch: 'FG-PP32-202602-001', qty: 7.9 }],
      'Extrusion', 'Afternoon', 'EXT-02', 'Vijay Singh', 'Amit Rathod', 'Die change scrap');
    log('Production: PROD-202602-001 — PP → Pipes 32mm');

    // Mar 2026
    await createProduction('PROD-202603-001', date(2026,3,1),
      [{ product: products['HDPE Granules'], batch: 'LOT-HDPE-202503-001', qty: 10 },
       { product: products['Calcium Carbonate'], batch: 'LOT-CACO-202503-001', qty: 0.5 }],
      [{ product: products['Plastic Pipes 20mm'], batch: 'FG-PP20-202603-001', qty: 9.8 }],
      'Extrusion', 'Morning', 'EXT-01', 'Ramesh Kumar', 'Suresh Patel', 'Startup scrap');
    log('Production: PROD-202603-001 — HDPE → Pipes 20mm');

    await createProduction('PROD-202603-002', date(2026,3,5),
      [{ product: products['PP Granules'], batch: 'LOT-PP-202503-001', qty: 6 },
       { product: products['Calcium Carbonate'], batch: 'LOT-CACO-202503-001', qty: 0.5 }],
      [{ product: products['Plastic Sheets 4mm'], batch: 'FG-PS4-202603-001', qty: 6.1 }],
      'Calendering', 'Morning', 'CAL-01', 'Deepak Verma', 'Amit Rathod', 'Edge trimming');
    log('Production: PROD-202603-002 — PP → Sheets 4mm');

    await createProduction('PROD-202603-003', date(2026,3,10),
      [{ product: products['HDPE Granules'], batch: 'LOT-HDPE-202503-001', qty: 8 },
       { product: products['Calcium Carbonate'], batch: 'LOT-CACO-202503-001', qty: 0.4 }],
      [{ product: products['Plastic Pipes 32mm'], batch: 'FG-PP32-202603-001', qty: 7.9 }],
      'Extrusion', 'Night', 'EXT-01', 'Manoj Yadav', 'Suresh Patel', 'Night shift scrap');
    log('Production: PROD-202603-003 — HDPE → Pipes 32mm');

    // ════════════════════════════════════════════════════════
    // 7. SALES ORDERS
    // ════════════════════════════════════════════════════════
    console.log('\n  [7/8] Sales Orders (6 months)');

    const calcGST = (qty, price, gstRate, buyerState) => {
      const taxable   = +(qty * price).toFixed(2);
      const totalTax  = +(taxable * gstRate / 100).toFixed(2);
      const intrastate = buyerState.toLowerCase() === 'haryana';
      return {
        type:         intrastate ? 'CGST+SGST' : 'IGST',
        rate:         gstRate,
        taxableValue: taxable,
        cgst:         intrastate ? +(totalTax/2).toFixed(2) : 0,
        sgst:         intrastate ? +(totalTax/2).toFixed(2) : 0,
        igst:         intrastate ? 0 : totalTax,
        totalTax,
        totalValue:   +(taxable + totalTax).toFixed(2),
      };
    };

    const salesData = [
      // Oct 2025
      { customer: { name: 'Ashok Pipes Pvt Ltd',  gstin: '06AABCA1234K1ZH', address: 'Faridabad, Haryana',    phone: '9876543210' }, product: 'Plastic Pipes 20mm', qty: 5,  price: 115000, date: date(2026,10,20), buyerState: 'Haryana',     dispatchStatus: 'Dispatched' },
      { customer: { name: 'BuildRight Ltd',         gstin: '27AABCB5678K1ZM', address: 'Pune, Maharashtra',    phone: '9876543211' }, product: 'Plastic Pipes 32mm', qty: 4,  price: 138000, date: date(2025,10,25), buyerState: 'Maharashtra', dispatchStatus: 'Dispatched' },
      // Nov 2025
      { customer: { name: 'Metro Infra',            gstin: '07AABCM9012K1ZP', address: 'New Delhi',            phone: '9876543212' }, product: 'Plastic Pipes 20mm', qty: 6,  price: 116000, date: date(2025,11,5),  buyerState: 'Delhi',       dispatchStatus: 'Dispatched' },
      { customer: { name: 'Sharma Plastics',        gstin: '06AABCS3456K1ZQ', address: 'Gurugram, Haryana',   phone: '9876543213' }, product: 'Plastic Sheets 4mm', qty: 3,  price: 125000, date: date(2025,11,12), buyerState: 'Haryana',     dispatchStatus: 'Dispatched' },
      { customer: { name: 'Gupta Industries',       gstin: '08AABCG7890K1ZR', address: 'Jaipur, Rajasthan',   phone: '9876543214' }, product: 'Plastic Pipes 32mm', qty: 3,  price: 140000, date: date(2025,11,20), buyerState: 'Rajasthan',   dispatchStatus: 'Dispatched' },
      // Dec 2025
      { customer: { name: 'Ashok Pipes Pvt Ltd',   gstin: '06AABCA1234K1ZH', address: 'Faridabad, Haryana',   phone: '9876543210' }, product: 'Plastic Pipes 20mm', qty: 7,  price: 118000, date: date(2025,12,8),  buyerState: 'Haryana',     dispatchStatus: 'Dispatched' },
      { customer: { name: 'NovaBuild Corp',         gstin: '24AABCN1234K1ZS', address: 'Ahmedabad, Gujarat',  phone: '9876543215' }, product: 'Plastic Pipes 20mm', qty: 5,  price: 118000, date: date(2025,12,15), buyerState: 'Gujarat',     dispatchStatus: 'Dispatched' },
      { customer: { name: 'BuildRight Ltd',         gstin: '27AABCB5678K1ZM', address: 'Pune, Maharashtra',   phone: '9876543211' }, product: 'Plastic Sheets 4mm', qty: 4,  price: 126000, date: date(2025,12,22), buyerState: 'Maharashtra', dispatchStatus: 'Dispatched' },
      // Jan 2026
      { customer: { name: 'Metro Infra',            gstin: '07AABCM9012K1ZP', address: 'New Delhi',            phone: '9876543212' }, product: 'Plastic Pipes 32mm', qty: 5,  price: 142000, date: date(2026,1,7),   buyerState: 'Delhi',       dispatchStatus: 'Dispatched' },
      { customer: { name: 'Sharma Plastics',        gstin: '06AABCS3456K1ZQ', address: 'Gurugram, Haryana',   phone: '9876543213' }, product: 'Plastic Pipes 20mm', qty: 6,  price: 120000, date: date(2026,1,14),  buyerState: 'Haryana',     dispatchStatus: 'Dispatched' },
      { customer: { name: 'Gupta Industries',       gstin: '08AABCG7890K1ZR', address: 'Jaipur, Rajasthan',   phone: '9876543214' }, product: 'Plastic Sheets 4mm', qty: 3,  price: 128000, date: date(2026,1,21),  buyerState: 'Rajasthan',   dispatchStatus: 'Dispatched' },
      // Feb 2026
      { customer: { name: 'Ashok Pipes Pvt Ltd',   gstin: '06AABCA1234K1ZH', address: 'Faridabad, Haryana',   phone: '9876543210' }, product: 'Plastic Pipes 20mm', qty: 8,  price: 122000, date: date(2026,2,5),   buyerState: 'Haryana',     dispatchStatus: 'Dispatched' },
      { customer: { name: 'NovaBuild Corp',         gstin: '24AABCN1234K1ZS', address: 'Ahmedabad, Gujarat',  phone: '9876543215' }, product: 'Plastic Pipes 32mm', qty: 4,  price: 145000, date: date(2026,2,12),  buyerState: 'Gujarat',     dispatchStatus: 'Dispatched' },
      { customer: { name: 'BuildRight Ltd',         gstin: '27AABCB5678K1ZM', address: 'Pune, Maharashtra',   phone: '9876543211' }, product: 'Plastic Pipes 20mm', qty: 6,  price: 122000, date: date(2026,2,19),  buyerState: 'Maharashtra', dispatchStatus: 'Dispatched' },
      { customer: { name: 'Metro Infra',            gstin: '07AABCM9012K1ZP', address: 'New Delhi',            phone: '9876543212' }, product: 'Plastic Sheets 4mm', qty: 4,  price: 130000, date: date(2026,2,25),  buyerState: 'Delhi',       dispatchStatus: 'Dispatched' },
      // Mar 2026
      { customer: { name: 'Ashok Pipes Pvt Ltd',   gstin: '06AABCA1234K1ZH', address: 'Faridabad, Haryana',   phone: '9876543210' }, product: 'Plastic Pipes 20mm', qty: 8,  price: 125000, date: date(2026,3,3),   buyerState: 'Haryana',     dispatchStatus: 'Dispatched' },
      { customer: { name: 'Sharma Plastics',        gstin: '06AABCS3456K1ZQ', address: 'Gurugram, Haryana',   phone: '9876543213' }, product: 'Plastic Pipes 32mm', qty: 4,  price: 148000, date: date(2026,3,8),   buyerState: 'Haryana',     dispatchStatus: 'Dispatched' },
      { customer: { name: 'BuildRight Ltd',         gstin: '27AABCB5678K1ZM', address: 'Pune, Maharashtra',   phone: '9876543211' }, product: 'Plastic Pipes 20mm', qty: 6,  price: 125000, date: date(2026,3,12),  buyerState: 'Maharashtra', dispatchStatus: 'Dispatched' },
      { customer: { name: 'Gupta Industries',       gstin: '08AABCG7890K1ZR', address: 'Jaipur, Rajasthan',   phone: '9876543214' }, product: 'Plastic Pipes 32mm', qty: 3,  price: 148000, date: date(2026,3,15),  buyerState: 'Rajasthan',   dispatchStatus: 'Dispatched' },
      { customer: { name: 'Metro Infra',            gstin: '07AABCM9012K1ZP', address: 'New Delhi',            phone: '9876543212' }, product: 'Plastic Pipes 20mm', qty: 5,  price: 125000, date: date(2026,3,18),  buyerState: 'Delhi',       dispatchStatus: 'Pending' },
      { customer: { name: 'NovaBuild Corp',         gstin: '24AABCN1234K1ZS', address: 'Ahmedabad, Gujarat',  phone: '9876543215' }, product: 'Plastic Sheets 4mm', qty: 3,  price: 132000, date: date(2026,3,20),  buyerState: 'Gujarat',     dispatchStatus: 'Pending' },
    ];

    for (const s of salesData) {
      const prod    = products[s.product];
      const gstRate = prod.gstRate || 18;
      const gst     = calcGST(s.qty, s.price, gstRate, s.buyerState);
      const ewaybill = gst.taxableValue > 50000 ? {
        number:      `EWB${Math.floor(Math.random()*9000000000+1000000000)}`,
        generatedAt: s.date,
        validUntil:  new Date(s.date.getTime() + 86400000),
      } : undefined;

      await SalesOrder.create({
        itemId:             prod._id,
        quantityOrdered:    s.qty,
        quantityDispatched: s.dispatchStatus === 'Dispatched' ? s.qty : 0,
        saleDate:           s.date,
        customer:           s.customer,
        unitPrice:          s.price,
        paymentStatus:      s.dispatchStatus === 'Dispatched' ? 'Paid' : 'Pending',
        dispatchStatus:     s.dispatchStatus,
        buyerState:         s.buyerState,
        sellerState:        'Haryana',
        gst,
        ewayBill:           ewaybill,
        invoiceNumber:      `INV-${Math.random().toString(36).substring(2,10).toUpperCase()}`,
      });

      // Deduct dispatched stock
      if (s.dispatchStatus === 'Dispatched') {
        const ledger = await StockLedger.findOne({ itemId: prod._id });
        if (ledger) {
          ledger.quantityOnHand = Math.max(0, ledger.quantityOnHand - s.qty);
          await ledger.save();
        }
      }
    }
    log(`Created ${salesData.length} sales orders with GST`);

    // ════════════════════════════════════════════════════════
    // 8. ALERTS
    // ════════════════════════════════════════════════════════
    console.log('\n  [8/8] Alerts');
    await Alert.create([
      { itemId: products['PVC Resin']._id,         alertType: 'Low Stock',    message: 'PVC Resin stock below threshold',         status: 'Active',   createdAt: daysAgo(5) },
      { itemId: products['BOPP Bags']._id,          alertType: 'Low Stock',    message: 'BOPP Bags stock running low',             status: 'Active',   createdAt: daysAgo(3) },
      { itemId: products['Stretch Film Roll']._id,  alertType: 'Low Stock',    message: 'Stretch Film Roll below minimum level',   status: 'Resolved', createdAt: daysAgo(10) },
      { itemId: products['LDPE Granules']._id,      alertType: 'Reorder',      message: 'LDPE Granules reorder point reached',     status: 'Active',   createdAt: daysAgo(2) },
      { itemId: products['Calcium Carbonate']._id,  alertType: 'Critical',     message: 'Calcium Carbonate critically low',        status: 'Resolved', createdAt: daysAgo(15) },
    ]);
    log('Created 5 alerts');

    // ── Summary ───────────────────────────────────────────────
    console.log('\n  ════════════════════════════════');
    console.log('  ✅ Seed Complete!\n');
    console.log('  Summary:');
    console.log(`    Users:              ${usersData.length}`);
    console.log(`    Categories:         ${categoriesData.length}`);
    console.log(`    Suppliers:          ${suppliersData.length}`);
    console.log(`    Products:           ${productsData.length}`);
    console.log(`    Purchase Orders:    14`);
    console.log(`    Production Entries: 9`);
    console.log(`    Sales Orders:       ${salesData.length}`);
    console.log(`    Alerts:             5`);
    console.log('\n  Login: admin@polytime.in / Admin1234');
    console.log('  ════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('\n  ✗ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

seed();
