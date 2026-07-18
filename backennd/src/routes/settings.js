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
    Object.assign(settings, req.body);
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
