const express = require('express');
const router = express.Router();
const BusinessSetting = require('../models/BusinessSetting');
const InvoiceSetting = require('../models/InvoiceSetting');
const { authenticate, authorize } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');
const { ROLES } = require('../constants');

router.use(authenticate);

router.get('/business', async (req, res) => {
  let settings = await BusinessSetting.findOne();
  if (!settings) {
    settings = await BusinessSetting.create({});
  }
  sendSuccess(res, settings);
});

router.put('/business', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), async (req, res) => {
  let settings = await BusinessSetting.findOne();
  if (!settings) {
    settings = await BusinessSetting.create(req.body);
  } else {
    settings.businessName = req.body.businessName ?? settings.businessName;
    settings.address = req.body.address ?? settings.address;
    settings.phone = req.body.phone ?? settings.phone;
    settings.email = req.body.email ?? settings.email;
    settings.phones = req.body.phones ?? settings.phones;
    settings.emails = req.body.emails ?? settings.emails;
    settings.website = req.body.website ?? settings.website;
    settings.taxId = req.body.taxId ?? settings.taxId;
    settings.currency = req.body.currency ?? settings.currency;
    settings.currencySymbol = req.body.currencySymbol ?? settings.currencySymbol;
    settings.timezone = req.body.timezone ?? settings.timezone;
    settings.dateFormat = req.body.dateFormat ?? settings.dateFormat;
    await settings.save();
  }
  sendSuccess(res, settings, 'Business settings updated');
});

router.get('/invoice', async (req, res) => {
  let settings = await InvoiceSetting.findOne();
  if (!settings) {
    settings = await InvoiceSetting.create({});
  }
  sendSuccess(res, settings);
});

router.put('/invoice', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), async (req, res) => {
  let settings = await InvoiceSetting.findOne();
  if (!settings) {
    settings = await InvoiceSetting.create(req.body);
  } else {
    Object.assign(settings, req.body);
    await settings.save();
  }
  sendSuccess(res, settings, 'Invoice settings updated');
});

module.exports = router;
