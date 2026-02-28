const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantityOrdered:  { type: Number, required: true, min: 1 },
    quantityReceived: { type: Number, default: 0, min: 0 },
    partialReceipt:   { type: Boolean, default: false }, // Y/N in ER
    unitPrice:        { type: Number, default: 0 },
  },
  { _id: true }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required'],
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    items: [purchaseOrderItemSchema],
    status: {
      type: String,
      enum: ['Pending', 'Partial', 'Received', 'Cancelled'],
      default: 'Pending',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

purchaseOrderSchema.methods.updateStatus = function () {
  const allReceived = this.items.every(
    (i) => i.quantityReceived >= i.quantityOrdered
  );
  const anyReceived = this.items.some((i) => i.quantityReceived > 0);

  if (allReceived) this.status = 'Received';
  else if (anyReceived) this.status = 'Partial';
  else this.status = 'Pending';
};

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
