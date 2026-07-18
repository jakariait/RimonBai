const productService = require('../services/productService');
const { sendSuccess } = require('../utils/response');

const createProduct = async (req, res) => {
  const product = await productService.createProduct(req.body, req.user._id);
  sendSuccess(res, product, 'Product created successfully', 201);
};

const getProducts = async (req, res) => {
  const result = await productService.getProducts(req.query);
  sendSuccess(res, result.data, 'Products fetched successfully', 200, result.meta);
};

const getProductById = async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  sendSuccess(res, product);
};

const updateProduct = async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  sendSuccess(res, product, 'Product updated successfully');
};

const deleteProduct = async (req, res) => {
  await productService.deleteProduct(req.params.id);
  sendSuccess(res, null, 'Product deleted successfully');
};

const getStockMovements = async (req, res) => {
  const result = await productService.getStockMovements(req.params.productId, req.query);
  sendSuccess(res, result.data, 'Stock movements fetched successfully', 200, result.meta);
};

const adjustStock = async (req, res) => {
  const { quantity, notes } = req.body;
  const product = await productService.adjustStock(req.params.id, quantity, notes, req.user._id);
  sendSuccess(res, product, 'Stock adjusted successfully');
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getStockMovements,
  adjustStock,
};
