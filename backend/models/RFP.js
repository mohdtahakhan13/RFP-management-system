const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  specifications: String,
  unitPrice: Number,
  totalPrice: Number
});

const rfpSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  structuredData: {
    items: [itemSchema],
    totalBudget: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    deliveryDate: Date,
    deliveryDays: Number,
    paymentTerms: String,
    warranty: String,
    specialRequirements: String
  },
  vendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }],
  sentVendors: [{
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    sentAt: Date,
    sentStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'sent', 'in-progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  proposals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RFP', rfpSchema);