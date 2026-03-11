const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['LOW_STOCK', 'OUT_OF_STOCK', 'REORDER_SUGGESTED'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['warning', 'critical'],
      default: 'warning',
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    message: { type: String, required: true },
    availableQty:  { type: Number },
    threshold:     { type: Number },
    isRead:        { type: Boolean, default: false },
    isResolved:    { type: Boolean, default: false },
    resolvedAt:    { type: Date },
  },
  { timestamps: true }
);

alertSchema.index({ itemId: 1, type: 1, isResolved: 1 });

module.exports = mongoose.model('Alert', alertSchema);
