const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const StockMovement = require('../models/StockMovement');
const Counter = require('../models/Counter');
const APIFeatures = require('../utils/apiFeatures');
const { generatePurchaseNumber, calculateTotals } = require('../utils/helpers');

const createPurchase = async (data, userId) => {
  let existing = await Counter.findOne({ key: 'purchase_number' });
  if (!existing) {
    const result = await Purchase.aggregate([
      { $match: { purchaseNumber: { $exists: true, $ne: null } } },
      {
        $addFields: {
          purchaseSeq: {
            $toInt: { $arrayElemAt: [{ $split: ['$purchaseNumber', '-'] }, 1] },
          },
        },
      },
      { $sort: { purchaseSeq: -1 } },
      { $limit: 1 },
      { $project: { _id: 0, purchaseSeq: 1 } },
    ]);
    const startSeq = result[0]?.purchaseSeq || 0;
    try {
      await Counter.create({ key: 'purchase_number', seq: startSeq });
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }
  const counter = await Counter.findOneAndUpdate(
    { key: 'purchase_number' },
    { $inc: { seq: 1 } },
    { new: true }
  );
  const purchaseNumber = generatePurchaseNumber('PUR', counter.seq);

  const items = data.items.map((item) => ({
    ...item,
    totalCost: item.quantity * item.unitCost,
  }));

  const totals = calculateTotals(
    items,
    data.discount,
    data.taxRate,
    data.shipping,
    data.otherCosts
  );

  const purchase = await Purchase.create({
    purchaseNumber,
    supplier: data.supplier,
    purchaseDate: data.purchaseDate || new Date(),
    items,
    subtotal: totals.subtotal,
    discount: totals.totalDiscount,
    taxRate: data.taxRate || 0,
    taxAmount: totals.taxAmount,
    shipping: data.shipping || 0,
    otherCosts: data.otherCosts || 0,
    grandTotal: totals.grandTotal,
    paidAmount: data.paidAmount || 0,
    dueAmount: totals.grandTotal - (data.paidAmount || 0),
    notes: data.notes || '',
    createdBy: userId,
  });

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (product) {
      const previousStock = product.currentStock;
      product.currentStock += item.quantity;
      product.purchasePrice = item.unitCost;
      await product.save();

      await StockMovement.create({
        product: product._id,
        type: 'purchase',
        quantity: item.quantity,
        previousStock,
        newStock: product.currentStock,
        reference: purchase._id,
        referenceModel: 'Purchase',
        notes: `Purchase: ${purchaseNumber}`,
        createdBy: userId,
      });
    }
  }

  await Supplier.findByIdAndUpdate(data.supplier, {
    $inc: {
      totalPurchases: totals.grandTotal,
      totalPaid: data.paidAmount || 0,
      outstandingBalance: purchase.dueAmount,
    },
  });

  return await Purchase.findById(purchase._id)
    .populate('supplier', 'companyName')
    .populate('items.product', 'productName sku');
};

const getPurchases = async (query) => {
  const features = new APIFeatures(
    Purchase.find()
      .populate('supplier', 'companyName phone')
      .populate('items.product', 'productName sku'),
    query
  )
    .search(['purchaseNumber'])
    .filter()
    .sort('-purchaseDate')
    .paginate();

  const purchases = await features.query;
  const total = await Purchase.countDocuments(features.query._conditions);
  return { data: purchases, meta: features.getPaginationMeta(total) };
};

const getPurchaseById = async (id) => {
  const purchase = await Purchase.findById(id)
    .populate('supplier', 'companyName contactPerson phone email address')
    .populate('items.product', 'productName sku brand modelNumber')
    .populate('createdBy', 'name');

  if (!purchase) {
    throw Object.assign(new Error('Purchase not found'), { statusCode: 404 });
  }
  return purchase;
};

const updatePurchase = async (id, data, userId) => {
  const existing = await Purchase.findById(id);
  if (!existing) {
    throw Object.assign(new Error('Purchase not found'), { statusCode: 404 });
  }

  for (const item of existing.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.currentStock -= item.quantity;
      if (product.currentStock < 0) product.currentStock = 0;
      await product.save();
    }
  }

  const supplier = await Supplier.findById(existing.supplier);
  if (supplier) {
    supplier.totalPurchases -= existing.grandTotal;
    supplier.totalPaid -= existing.paidAmount;
    supplier.outstandingBalance -= existing.dueAmount;
    await supplier.save();
  }

  await StockMovement.deleteMany({ reference: id, referenceModel: 'Purchase' });

  const items = data.items.map((item) => ({
    ...item,
    totalCost: item.quantity * item.unitCost,
  }));

  const totals = calculateTotals(
    items,
    data.discount,
    data.taxRate,
    data.shipping,
    data.otherCosts
  );

  const purchase = await Purchase.findByIdAndUpdate(
    id,
    {
      supplier: data.supplier,
      purchaseDate: data.purchaseDate || existing.purchaseDate,
      items,
      subtotal: totals.subtotal,
      discount: totals.totalDiscount,
      taxRate: data.taxRate || 0,
      taxAmount: totals.taxAmount,
      shipping: data.shipping || 0,
      otherCosts: data.otherCosts || 0,
      grandTotal: totals.grandTotal,
      paidAmount: data.paidAmount || 0,
      dueAmount: totals.grandTotal - (data.paidAmount || 0),
      notes: data.notes || '',
    },
    { new: true }
  );

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (product) {
      const previousStock = product.currentStock;
      product.currentStock += item.quantity;
      product.purchasePrice = item.unitCost;
      await product.save();

      await StockMovement.create({
        product: product._id,
        type: 'purchase',
        quantity: item.quantity,
        previousStock,
        newStock: product.currentStock,
        reference: purchase._id,
        referenceModel: 'Purchase',
        notes: `Purchase: ${existing.purchaseNumber}`,
        createdBy: userId,
      });
    }
  }

  const updatedSupplier = await Supplier.findById(data.supplier);
  if (updatedSupplier) {
    updatedSupplier.totalPurchases += totals.grandTotal;
    updatedSupplier.totalPaid += data.paidAmount || 0;
    updatedSupplier.outstandingBalance += purchase.dueAmount;
    await updatedSupplier.save();
  }

  return await Purchase.findById(purchase._id)
    .populate('supplier', 'companyName')
    .populate('items.product', 'productName sku');
};

const updatePurchaseStatus = async (id, status) => {
  const purchase = await Purchase.findByIdAndUpdate(id, { status }, { new: true });
  if (!purchase) {
    throw Object.assign(new Error('Purchase not found'), { statusCode: 404 });
  }
  return purchase;
};

const deletePurchase = async (id) => {
  const existing = await Purchase.findById(id);
  if (!existing) {
    throw Object.assign(new Error('Purchase not found'), { statusCode: 404 });
  }

  for (const item of existing.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.currentStock -= item.quantity;
      if (product.currentStock < 0) product.currentStock = 0;
      await product.save();
    }
  }

  const supplier = await Supplier.findById(existing.supplier);
  if (supplier) {
    supplier.totalPurchases -= existing.grandTotal;
    supplier.totalPaid -= existing.paidAmount;
    supplier.outstandingBalance -= existing.dueAmount;
    await supplier.save();
  }

  await StockMovement.deleteMany({ reference: id, referenceModel: 'Purchase' });
  await Purchase.findByIdAndDelete(id);

  return { message: 'Purchase deleted successfully' };
};

module.exports = {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  updatePurchaseStatus,
  deletePurchase,
};
