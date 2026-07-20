const mongoose = require('mongoose');

const customerPaymentAllocationSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerPayment',
      required: true,
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: true,
    },
    allocatedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

customerPaymentAllocationSchema.index({ payment: 1 });
customerPaymentAllocationSchema.index({ invoice: 1 });
customerPaymentAllocationSchema.index({ payment: 1, invoice: 1 }, { unique: true });

module.exports = mongoose.model('CustomerPaymentAllocation', customerPaymentAllocationSchema);
