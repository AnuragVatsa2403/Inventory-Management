const mongoose = require('mongoose');

const stockLedgerSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    batchNumber: {
      type: String,
      trim: true,
    },
    serialNumber: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    quantityOnHand: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

stockLedgerSchema.virtual('availableQuantity').get(function () {
  return Math.max(0, this.quantityOnHand - this.reservedQuantity);
});

stockLedgerSchema.set('toJSON', { virtuals: true });
stockLedgerSchema.set('toObject', { virtuals: true });

stockLedgerSchema.statics.getTotalAvailable = async function (itemId) {
  const result = await this.aggregate([
    { $match: { itemId: new mongoose.Types.ObjectId(itemId) } },
    {
      $group: {
        _id: '$itemId',
        totalOnHand:   { $sum: '$quantityOnHand' },
        totalReserved: { $sum: '$reservedQuantity' },
      },
    },
    {
      $project: {
        totalOnHand: 1,
        totalReserved: 1,
        totalAvailable: { $subtract: ['$totalOnHand', '$totalReserved'] },
      },
    },
  ]);
  return result[0] || { totalOnHand: 0, totalReserved: 0, totalAvailable: 0 };
};

stockLedgerSchema.statics.getLowStockItems = async function () {
  return this.aggregate([
    {
      $group: {
        _id: '$itemId',
        totalAvailable: {
          $sum: { $subtract: ['$quantityOnHand', '$reservedQuantity'] },
        },
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $match: {
        $expr: {
          $lte: ['$totalAvailable', '$product.lowStockThreshold'],
        },
      },
    },
  ]);
};

module.exports = mongoose.model('StockLedger', stockLedgerSchema);
