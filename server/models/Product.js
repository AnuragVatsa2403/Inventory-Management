const mongoose = require('mongoose');



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
    grade: { type: String, trim: true },       
    meltFlowIndex: { type: Number }, 
    density: { type: Number },                  
    hsnCode: { type: String, trim: true },      
    gstRate: { type: Number, default: 18 },     
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
