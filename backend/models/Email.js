const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true
  },
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  from: {
    type: String,
    required: true 
  },
  fromName: {
    type: String,
    default: 'Unknown Vendor'
  },
  subject: {
    type: String,
    required: true
  },
  text: {
    type: String,
    default: ''
  },
  html: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  rfpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RFP'
  },
  processed: {
    type: Boolean,
    default: false
  },
  simulated: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
emailSchema.index({ messageId: 1 });
emailSchema.index({ rfpId: 1 });
emailSchema.index({ processed: 1 });

module.exports = mongoose.model('Email', emailSchema);
