const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Category = require('../models/Category');
const BusinessSetting = require('../models/BusinessSetting');
const InvoiceSetting = require('../models/InvoiceSetting');
const { ROLES } = require('../constants');

const seed = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('MONGO_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const adminExists = await User.findOne({ email: 'admin@rimonbai.com' });
    if (!adminExists) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@rimonbai.com',
        password: 'admin123',
        role: ROLES.SUPER_ADMIN,
        phone: '01700000000',
      });
      console.log('Super Admin created: admin@rimonbai.com / admin123');
    }

    const categories = [
      'Diagnostic Equipment',
      'Surgical Instruments',
      'Patient Monitoring',
      'Lab Equipment',
      'Medical Furniture',
      'Consumables',
      ' implants',
      'Orthopedic',
      'Cardiology',
      'Imaging',
    ];
    for (const name of categories) {
      const exists = await Category.findOne({ name });
      if (!exists) {
        await Category.create({ name });
        console.log(`Category created: ${name}`);
      }
    }

    const bizSettings = await BusinessSetting.findOne();
    if (!bizSettings) {
      await BusinessSetting.create({
        businessName: 'Rimon Medical Equipment',
        address: 'Dhaka, Bangladesh',
        phone: '+880 1700-000000',
        email: 'info@rimonbai.com',
      });
      console.log('Business settings created');
    }

    const invSettings = await InvoiceSetting.findOne();
    if (!invSettings) {
      await InvoiceSetting.create({});
      console.log('Invoice settings created');
    }

    console.log('\nSeed completed successfully!');
  } catch (error) {
    console.error('Seed error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
