const mongoose = require('mongoose');

// Item types for Polytime Industries (plastic manufacturer)
// Raw Materials: HDPE Granules, LDPE Granules, PP Homopolymer, PVC Resin, etc.
// Finished Goods: Plastic Chips (HDPE, LDPE, PP), Masterbatch, etc.

const productSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      required: [true, 'Item type is required'],
      enum: ['Raw Material', 'Finished Goods', 'Packaging', 'Consumable', 'Spare Part'],
      trim: true,
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    batchNumber: { type: String, trim: true },
    serialNumber: { type: String, unique: true, sparse: true, trim: true },
    unit: {
      type: String,
      default: 'Tonnes',
      enum: ['Tonnes', 'Kg', 'Litres', 'Pieces', 'Bags', 'Drums'],
      trim: true,
    },
    department: {
      type: String,
      enum: ['Raw Materials', 'Processing', 'Finished Goods', 'Quality Control', 'Warehouse', 'Dispatch'],
      trim: true,
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    lowStockThreshold: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true },
    // Polytime-specific: grade/specification info
    grade: { type: String, trim: true },        // e.g. HD-50MA180, LD-2426H
    meltFlowIndex: { type: Number },            // MFI for granules
    density: { type: Number },                  // g/cm³
    hsnCode: { type: String, trim: true },      // GST HSN code e.g. 3901, 3902, 3904
    gstRate: { type: Number, default: 18 },     // GST % — 5, 12, 18 or 28
  },
  { timestamps: true }
);

productSchema.virtual('currentStock', {
  ref: 'StockLedger',
  localField: '_id',
  foreignField: 'itemId',
  justOne: false,
});

module.exports = mongoose.model('Product', productSchema);
