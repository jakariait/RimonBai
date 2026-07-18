const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');

const getInventorySummary = async () => {
  const products = await Product.find().populate('category', 'name');

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.currentStock, 0);
  const inventoryValue = products.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0);
  const inventoryValueBySelling = products.reduce((sum, p) => sum + (p.currentStock * p.sellingPrice), 0);
  const lowStockProducts = products.filter(p => p.currentStock <= p.minimumStock && p.currentStock > 0);
  const outOfStockProducts = products.filter(p => p.currentStock === 0);

  return {
    totalProducts,
    totalStock,
    inventoryValue,
    inventoryValueBySelling,
    lowStockCount: lowStockProducts.length,
    outOfStockCount: outOfStockProducts.length,
    lowStockProducts,
    outOfStockProducts,
  };
};

const getLowStockProducts = async () => {
  return Product.find({
    $expr: { $lte: ['$currentStock', '$minimumStock'] },
    currentStock: { $gt: 0 },
  }).populate('category', 'name').sort({ currentStock: 1 });
};

const getOutOfStockProducts = async () => {
  return Product.find({ currentStock: 0 }).populate('category', 'name');
};

const getStockMovementsReport = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 50;
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.product) filter.product = query.product;
  if (query.type) filter.type = query.type;
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  const movements = await StockMovement.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('product', 'productName sku')
    .populate('createdBy', 'name');

  const total = await StockMovement.countDocuments(filter);

  return {
    data: movements,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = { getInventorySummary, getLowStockProducts, getOutOfStockProducts, getStockMovementsReport };
