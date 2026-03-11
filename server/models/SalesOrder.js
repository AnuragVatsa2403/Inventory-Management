const mongoose = require('mongoose');

const salesOrderSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    quantityOrdered: {
      type: Number,
      required: [true, 'Quantity ordered is required'],
      min: 1,
    },
    quantityDispatched: {
      type: Number,
      default: 0,
      min: 0,
    },
    saleDate: {
      type: Date,
      default: Date.now,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Pending',
    },
    creditNoteIssued: {
      type: Boolean,   // Y/N in ER
      default: false,
    },
    customer: {
      name:  { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    dispatchStatus: {
      type: String,
      enum: ['Pending', 'Partial', 'Dispatched', 'Cancelled'],
      default: 'Pending',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

salesOrderSchema.methods.updateDispatchStatus = function () {
  if (this.quantityDispatched >= this.quantityOrdered) {
    this.dispatchStatus = 'Dispatched';
  } else if (this.quantityDispatched > 0) {
    this.dispatchStatus = 'Partial';
  } else {
    this.dispatchStatus = 'Pending';
  }
};

module.exports = mongoose.model('SalesOrder', salesOrderSchema);
