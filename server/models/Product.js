const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      required: [true, 'Item type is required'],
      trim: true,
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    batchNumber: {
      type: String,
      trim: true,
    },
    serialNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    unit: {
      type: String,
      default: 'Metric Tonnes',
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
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
