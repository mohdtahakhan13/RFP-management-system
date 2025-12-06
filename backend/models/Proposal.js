const mongoose = require('mongoose');

const proposalItemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  specifications: String,
  unitPrice: Number,
  totalPrice: Number
});

const proposalSchema = new mongoose.Schema({
  rfpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RFP',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  emailContent: {
    subject: String,
    body: String,
    attachments: [String],
    receivedAt: Date
  },
  structuredData: {
    items: [proposalItemSchema],
    totalPrice: Number,
    currency: String,
    deliveryDate: Date,
    deliveryDays: Number,
    paymentTerms: String,
    warranty: String,
    notes: String
  },
  aiAnalysis: {
    completenessScore: Number,
    priceScore: Number,
    deliveryScore: Number,
    termsScore: Number,
    totalScore: Number,
    summary: String,
    strengths: [String],
    weaknesses: [String],
    recommendation: {
      type: String,
      enum: ['high', 'medium', 'low']
    }
  },
  emailSource: {
    messageId: String,
    receivedAt: Date,
    subject: String
  },
  status: {
    type: String,
    enum: ['pending', 'received', 'under-review', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Proposal', proposalSchema);