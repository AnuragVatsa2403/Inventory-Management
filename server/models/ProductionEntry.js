const mongoose = require('mongoose');

// Production Entry — records raw material consumption and finished goods output
// Example: 10 MT HDPE + 0.5 MT additive → 9.2 MT plastic pipes + 1.3 MT wastage
const productionEntrySchema = new mongoose.Schema(
  {
    batchCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // e.g. PROD-HDPE-202503-001
    },
    productionDate: { type: Date, default: Date.now },
    shift: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Night'],
      default: 'Morning',
    },
    status: {
      type: String,
      enum: ['Draft', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Draft',
    },

    // ── Raw Materials Consumed ────────────────────────────────
    // Each line: which material, from which batch, how much consumed
    rawMaterials: [
      {
        itemId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        batchNumber:  { type: String, trim: true },
        quantityUsed: { type: Number, required: true, min: 0 },  // in Tonnes
        unit:         { type: String, default: 'Tonnes' },
      },
    ],

    // ── Finished Goods Produced ───────────────────────────────
    finishedGoods: [
      {
        itemId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        batchNumber:      { type: String, trim: true },   // new batch code for this production
        quantityProduced: { type: Number, required: true, min: 0 },  // in Tonnes
        unit:             { type: String, default: 'Tonnes' },
      },
    ],

    // ── Wastage / Loss ────────────────────────────────────────
    // Auto-calculated: total raw material in - total finished goods out
    wastage: {
      quantity:    { type: Number, default: 0 },   // Tonnes lost
      percentage:  { type: Number, default: 0 },   // % of total raw material
      reason:      { type: String, trim: true },    // e.g. "Startup scrap", "Quality rejection"
    },

    // ── Machine / Process Info ────────────────────────────────
    machineId:     { type: String, trim: true },    // e.g. "EXT-01", "INJ-02"
    processType: {
      type: String,
      enum: ['Extrusion', 'Injection Moulding', 'Blow Moulding', 'Calendering', 'Other'],
      default: 'Extrusion',
    },
    operatorName:  { type: String, trim: true },
    supervisorName:{ type: String, trim: true },
    notes:         { type: String, trim: true },

    // ── Created by ────────────────────────────────────────────
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-calculate wastage before saving
productionEntrySchema.pre('save', function (next) {
  const totalIn  = this.rawMaterials.reduce((s, m) => s + (m.quantityUsed || 0), 0);
  const totalOut = this.finishedGoods.reduce((s, g) => s + (g.quantityProduced || 0), 0);
  const lost     = Math.max(0, totalIn - totalOut);
  this.wastage.quantity   = +lost.toFixed(3);
  this.wastage.percentage = totalIn > 0 ? +(lost / totalIn * 100).toFixed(2) : 0;
  next();
});

module.exports = mongoose.model('ProductionEntry', productionEntrySchema);
