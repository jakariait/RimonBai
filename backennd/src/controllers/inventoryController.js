const inventoryService = require('../services/inventoryService');
const { sendSuccess } = require('../utils/response');

const getInventorySummary = async (req, res) => {
  const summary = await inventoryService.getInventorySummary();
  sendSuccess(res, summary, 'Inventory summary fetched successfully');
};

const getLowStockProducts = async (req, res) => {
  const products = await inventoryService.getLowStockProducts();
  sendSuccess(res, products, 'Low stock products fetched successfully');
};

const getOutOfStockProducts = async (req, res) => {
  const products = await inventoryService.getOutOfStockProducts();
  sendSuccess(res, products, 'Out of stock products fetched successfully');
};

const getStockMovementsReport = async (req, res) => {
  const result = await inventoryService.getStockMovementsReport(req.query);
  sendSuccess(res, result.data, 'Stock movements fetched successfully', 200, result.meta);
};

module.exports = { getInventorySummary, getLowStockProducts, getOutOfStockProducts, getStockMovementsReport };
