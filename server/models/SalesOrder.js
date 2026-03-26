const mongoose = require('mongoose');

const salesOrderSchema = new mongoose.Schema(
  {
    itemId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantityOrdered:   { type: Number, required: true, min: 0 },   
    quantityDispatched:{ type: Number, default: 0, min: 0 },
    saleDate:          { type: Date, default: Date.now },
    customer: {
      name:    { type: String, trim: true },
      email:   { type: String, trim: true, lowercase: true },
      phone:   { type: String, trim: true },
      gstin:   { type: String, trim: true },
      address: { type: String, trim: true },
    },
    unitPrice:         { type: Number, default: 0 },    
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Partial'],
      default: 'Pending',
    },
    dispatchStatus: {
      type: String,
      enum: ['Pending', 'Partial', 'Dispatched', 'Cancelled'],
      default: 'Pending',
    },
    vehicleNumber:   { type: String, trim: true },
    invoiceNumber:   { type: String, trim: true },
    creditNoteIssued:{ type: Boolean, default: false },
    notes:           { type: String, trim: true },
  
    gst: {
      type:        { type: String, enum: ['CGST+SGST', 'IGST', 'Exempt'], default: 'CGST+SGST' },
      rate:        { type: Number, default: 18 },  
      taxableValue:{ type: Number, default: 0 },    
      cgst:        { type: Number, default: 0 },    
      sgst:        { type: Number, default: 0 },    
      igst:        { type: Number, default: 0 },    
      totalTax:    { type: Number, default: 0 },
      totalValue:  { type: Number, default: 0 },    
    },
    ewayBill: {
      number:      { type: String, trim: true },    
      generatedAt: { type: Date },
      validUntil:  { type: Date },
    },
    sellerState:   { type: String, default: 'Haryana' },
    buyerState:    { type: String, trim: true },         
  },
  { timestamps: true }
);

salesOrderSchema.methods.updateDispatchStatus = function () {
  if (this.quantityDispatched >= this.quantityOrdered) this.dispatchStatus = 'Dispatched';
  else if (this.quantityDispatched > 0)                this.dispatchStatus = 'Partial';
  else                                                 this.dispatchStatus = 'Pending';
};

module.exports = mongoose.model('SalesOrder', salesOrderSchema);
