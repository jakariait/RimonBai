const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const StockMovement = require('../models/StockMovement');
const APIFeatures = require('../utils/apiFeatures');
const { generateInvoiceNumber, calculateTotals } = require('../utils/helpers');

const createSale = async (data, userId) => {
  const count = await Sale.countDocuments();
  const invoiceNumber = generateInvoiceNumber('INV', count + 1);

  const items = data.items.map((item) => ({
    ...item,
    totalPrice: item.quantity * item.unitPrice,
  }));

  const totals = calculateTotals(
    items.map((i) => ({ quantity: i.quantity, unitCost: i.unitPrice })),
    data.discount,
    data.taxRate,
    data.deliveryCharge,
    0
  );

  const sale = await Sale.create({
    invoiceNumber,
    customer: data.customer,
    saleDate: data.saleDate || new Date(),
    items,
    subtotal: totals.subtotal,
    discount: totals.totalDiscount,
    taxRate: data.taxRate || 0,
    taxAmount: totals.taxAmount,
    deliveryCharge: data.deliveryCharge || 0,
    grandTotal: totals.grandTotal,
    paidAmount: data.paidAmount || 0,
    dueAmount: totals.grandTotal - (data.paidAmount || 0),
    paymentMethod: data.paymentMethod || 'Cash',
    notes: data.notes || '',
    createdBy: userId,
  });

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (product) {
      const previousStock = product.currentStock;
      product.currentStock -= item.quantity;

      if (product.currentStock < 0) {
        product.currentStock = 0;
      }

      await product.save();

      await StockMovement.create({
        product: product._id,
        type: 'sale',
        quantity: -item.quantity,
        previousStock,
        newStock: product.currentStock,
        reference: sale._id,
        referenceModel: 'Sale',
        notes: `Sale: ${invoiceNumber}`,
        createdBy: userId,
      });
    }
  }

  await Customer.findByIdAndUpdate(data.customer, {
    $inc: {
      totalSales: totals.grandTotal,
      totalPaid: data.paidAmount || 0,
      dueBalance: sale.dueAmount,
    },
  });

  return await Sale.findById(sale._id)
    .populate('customer', 'name company phone')
    .populate('items.product', 'productName sku sellingPrice');
};

const getSales = async (query) => {
  const features = new APIFeatures(
    Sale.find()
      .populate('customer', 'name company phone')
      .populate('items.product', 'productName sku'),
    query
  )
    .search(['invoiceNumber'])
    .filter()
    .sort('-saleDate')
    .paginate();

  const sales = await features.query;
  const total = await Sale.countDocuments(features.query._conditions);
  return { data: sales, meta: features.getPaginationMeta(total) };
};

const getSaleById = async (id) => {
  const sale = await Sale.findById(id)
    .populate('customer', 'name company phone email address')
    .populate('items.product', 'productName sku brand modelNumber sellingPrice')
    .populate('createdBy', 'name');

  if (!sale) {
    throw Object.assign(new Error('Sale not found'), { statusCode: 404 });
  }
  return sale;
};

const updateSale = async (id, data, userId) => {
  const existing = await Sale.findById(id);
  if (!existing) {
    throw Object.assign(new Error('Sale not found'), { statusCode: 404 });
  }

  for (const item of existing.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.currentStock += item.quantity;
      await product.save();
    }
  }

  const customer = await Customer.findById(existing.customer);
  if (customer) {
    customer.totalSales -= existing.grandTotal;
    customer.totalPaid -= existing.paidAmount;
    customer.dueBalance -= existing.dueAmount;
    await customer.save();
  }

  await StockMovement.deleteMany({ reference: id, referenceModel: 'Sale' });

  const items = data.items.map((item) => ({
    ...item,
    totalPrice: item.quantity * item.unitPrice,
  }));

  const totals = calculateTotals(
    items.map((i) => ({ quantity: i.quantity, unitCost: i.unitPrice })),
    data.discount,
    data.taxRate,
    data.deliveryCharge,
    0
  );

  const sale = await Sale.findByIdAndUpdate(
    id,
    {
      customer: data.customer,
      saleDate: data.saleDate || existing.saleDate,
      items,
      subtotal: totals.subtotal,
      discount: totals.totalDiscount,
      taxRate: data.taxRate || 0,
      taxAmount: totals.taxAmount,
      deliveryCharge: data.deliveryCharge || 0,
      grandTotal: totals.grandTotal,
      paidAmount: data.paidAmount || 0,
      dueAmount: totals.grandTotal - (data.paidAmount || 0),
      paymentMethod: data.paymentMethod || 'Cash',
      notes: data.notes || '',
    },
    { new: true }
  );

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (product) {
      const previousStock = product.currentStock;
      product.currentStock -= item.quantity;
      if (product.currentStock < 0) product.currentStock = 0;
      await product.save();

      await StockMovement.create({
        product: product._id,
        type: 'sale',
        quantity: -item.quantity,
        previousStock,
        newStock: product.currentStock,
        reference: sale._id,
        referenceModel: 'Sale',
        notes: `Sale: ${existing.invoiceNumber}`,
        createdBy: userId,
      });
    }
  }

  const updatedCustomer = await Customer.findById(data.customer);
  if (updatedCustomer) {
    updatedCustomer.totalSales += totals.grandTotal;
    updatedCustomer.totalPaid += data.paidAmount || 0;
    updatedCustomer.dueBalance += sale.dueAmount;
    await updatedCustomer.save();
  }

  return await Sale.findById(sale._id)
    .populate('customer', 'name company phone')
    .populate('items.product', 'productName sku sellingPrice');
};

const updateSaleStatus = async (id, status) => {
  const sale = await Sale.findByIdAndUpdate(id, { status }, { new: true });
  if (!sale) {
    throw Object.assign(new Error('Sale not found'), { statusCode: 404 });
  }
  return sale;
};

module.exports = { createSale, getSales, getSaleById, updateSale, updateSaleStatus };
