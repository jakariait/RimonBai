const mongoose = require('mongoose');
const { PAYMENT_METHODS } = require('../constants');

const paymentSchema = new mongoose.Schema({
  referenceType: {
    type: String,
    enum: ['purchase', 'sale'],
    required: true,
  },
  reference: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'referenceType',
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    default: null,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  paymentMethod: {
    type: String,
    enum: PAYMENT_METHODS,
    default: 'Cash',
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

paymentSchema.index({ reference: 1 });
paymentSchema.index({ supplier: 1 });
paymentSchema.index({ customer: 1 });
paymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
