const mongoose = require('mongoose');

const goodsReceiptSchema = new mongoose.Schema(
  {
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: [true, 'Purchase Order is required'],
    },
    
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    batchNumber: {
      type: String,
      trim: true,
    },
    quantityReceived: {
      type: Number,
      required: [true, 'Quantity received is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    receiptDate: {
      type: Date,
      default: Date.now,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GoodsReceipt', goodsReceiptSchema);
