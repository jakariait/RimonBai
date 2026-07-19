const saleService = require('../services/saleService');
const { sendSuccess } = require('../utils/response');

const createSale = async (req, res) => {
  const sale = await saleService.createSale(req.body, req.user._id);
  sendSuccess(res, sale, 'Sale created successfully', 201);
};

const getSales = async (req, res) => {
  const result = await saleService.getSales(req.query);
  sendSuccess(res, result.data, 'Sales fetched successfully', 200, result.meta);
};

const getSaleById = async (req, res) => {
  const sale = await saleService.getSaleById(req.params.id);
  sendSuccess(res, sale);
};

const updateSale = async (req, res) => {
  const sale = await saleService.updateSale(req.params.id, req.body, req.user._id);
  sendSuccess(res, sale, 'Sale updated successfully');
};

const updateSaleStatus = async (req, res) => {
  const sale = await saleService.updateSaleStatus(req.params.id, req.body.status);
  sendSuccess(res, sale, 'Sale status updated');
};

module.exports = { createSale, getSales, getSaleById, updateSale, updateSaleStatus };
