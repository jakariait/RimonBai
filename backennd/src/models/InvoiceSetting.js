const mongoose = require('mongoose');

const invoiceSettingSchema = new mongoose.Schema(
  {
    prefix: {
      type: String,
      default: 'INV',
    },
    nextNumber: {
      type: Number,
      default: 1,
    },
    defaultTaxRate: {
      type: Number,
      default: 0,
    },
    defaultPaymentTerms: {
      type: String,
      default: 'Payment due within 30 days',
    },
    showLogo: {
      type: Boolean,
      default: true,
    },
    showSignature: {
      type: Boolean,
      default: true,
    },
    footerText: {
      type: String,
      default: 'Thank you for your business!',
    },
    termsAndConditions: {
      type: String,
      default: 'All sales are final. Please inspect goods upon delivery.',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('InvoiceSetting', invoiceSettingSchema);
