const mongoose = require('mongoose');

const businessSettingSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      default: 'Medical Equipment Reseller',
    },
    businessLogo: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    phones: {
      type: [String],
      default: [],
    },
    emails: {
      type: [String],
      default: [],
    },
    website: {
      type: String,
      default: '',
    },
    taxId: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'BDT',
    },
    currencySymbol: {
      type: String,
      default: '৳',
    },
    timezone: {
      type: String,
      default: 'Asia/Dhaka',
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BusinessSetting', businessSettingSchema);
