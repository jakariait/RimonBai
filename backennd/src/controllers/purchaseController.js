const purchaseService = require('../services/purchaseService');
const { sendSuccess } = require('../utils/response');

const createPurchase = async (req, res) => {
  const purchase = await purchaseService.createPurchase(req.body, req.user._id);
  sendSuccess(res, purchase, 'Purchase created successfully', 201);
};

const getPurchases = async (req, res) => {
  const result = await purchaseService.getPurchases(req.query);
  sendSuccess(res, result.data, 'Purchases fetched successfully', 200, result.meta);
};

const getPurchaseById = async (req, res) => {
  const purchase = await purchaseService.getPurchaseById(req.params.id);
  sendSuccess(res, purchase);
};

const updatePurchase = async (req, res) => {
  const purchase = await purchaseService.updatePurchase(req.params.id, req.body, req.user._id);
  sendSuccess(res, purchase, 'Purchase updated successfully');
};

const updatePurchaseStatus = async (req, res) => {
  const purchase = await purchaseService.updatePurchaseStatus(req.params.id, req.body.status);
  sendSuccess(res, purchase, 'Purchase status updated');
};

module.exports = { createPurchase, getPurchases, getPurchaseById, updatePurchase, updatePurchaseStatus };
