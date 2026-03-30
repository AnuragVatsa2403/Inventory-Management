const mongoose = require('mongoose');


const productionEntrySchema = new mongoose.Schema(
  {
    batchCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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

    
    rawMaterials: [
      {
        itemId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        batchNumber:  { type: String, trim: true },
        quantityUsed: { type: Number, required: true, min: 0 },  // in Tonnes
        unit:         { type: String, default: 'Tonnes' },
      },
    ],

   
    finishedGoods: [
      {
        itemId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        batchNumber:      { type: String, trim: true },   // new batch code for this production
        quantityProduced: { type: Number, required: true, min: 0 },  // in Tonnes
        unit:             { type: String, default: 'Tonnes' },
      },
    ],

   
    wastage: {
      quantity:    { type: Number, default: 0 },   
      percentage:  { type: Number, default: 0 },   
      reason:      { type: String, trim: true },    
    },

    machineId:     { type: String, trim: true },  
    processType: {
      type: String,
      enum: ['Extrusion', 'Injection Moulding', 'Blow Moulding', 'Calendering', 'Other'],
      default: 'Extrusion',
    },
    operatorName:  { type: String, trim: true },
    supervisorName:{ type: String, trim: true },
    notes:         { type: String, trim: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

productionEntrySchema.pre('save', function (next) {
  const totalIn  = this.rawMaterials.reduce((s, m) => s + (m.quantityUsed || 0), 0);
  const totalOut = this.finishedGoods.reduce((s, g) => s + (g.quantityProduced || 0), 0);
  const lost     = Math.max(0, totalIn - totalOut);
  this.wastage.quantity   = +lost.toFixed(3);
  this.wastage.percentage = totalIn > 0 ? +(lost / totalIn * 100).toFixed(2) : 0;
  next();
});

module.exports = mongoose.model('ProductionEntry', productionEntrySchema);
