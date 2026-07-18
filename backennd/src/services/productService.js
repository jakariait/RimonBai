const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const APIFeatures = require('../utils/apiFeatures');
const { generateSKU } = require('../utils/helpers');

const createProduct = async (data, userId) => {
  if (!data.sku) {
    const count = await Product.countDocuments();
    data.sku = generateSKU(data.category || 'GEN', data.brand || 'XX', count + 1);
  }

  const product = await Product.create(data);

  if (data.currentStock > 0) {
    await StockMovement.create({
      product: product._id,
      type: 'adjustment',
      quantity: data.currentStock,
      previousStock: 0,
      newStock: data.currentStock,
      reference: product._id,
      referenceModel: 'Product',
      notes: 'Initial stock',
      createdBy: userId,
    });
  }

  return product;
};

const getProducts = async (query) => {
  const features = new APIFeatures(Product.find().populate('category', 'name'), query)
    .search(['productName', 'sku', 'brand', 'modelNumber', 'serialNumber', 'barcode'])
    .filter()
    .sort()
    .paginate();

  const products = await features.query;
  const total = await Product.countDocuments(features.query._conditions);
  return { data: products, meta: features.getPaginationMeta(total) };
};

const getProductById = async (id) => {
  const product = await Product.findById(id).populate('category', 'name');
  if (!product) {
    throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  }
  return product;
};

const updateProduct = async (id, data) => {
  const product = await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate('category', 'name');
  if (!product) {
    throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  }
  return product;
};

const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  }
  await StockMovement.deleteMany({ product: id });
  return product;
};

const getStockMovements = async (productId, query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 50;
  const skip = (page - 1) * limit;

  const filter = { product: productId };
  const movements = await StockMovement.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
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

const adjustStock = async (productId, quantity, notes, userId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  }

  const previousStock = product.currentStock;
  product.currentStock += quantity;

  if (product.currentStock < 0) {
    throw Object.assign(new Error('Insufficient stock'), { statusCode: 400 });
  }

  await product.save();

  await StockMovement.create({
    product: productId,
    type: 'adjustment',
    quantity,
    previousStock,
    newStock: product.currentStock,
    reference: productId,
    referenceModel: 'Product',
    notes: notes || 'Stock adjustment',
    createdBy: userId,
  });

  return product;
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
