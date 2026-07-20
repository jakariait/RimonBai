const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const StockMovement = require('../models/StockMovement');
const APIFeatures = require('../utils/apiFeatures');
const { generateInvoiceNumber, calculateTotals } = require('../utils/helpers');
const customerPaymentService = require('./customerPaymentService');

const getCustomerBalanceBeforeInvoice = async (customerId) => {
  const summary = await customerPaymentService.getCustomerFinancialSummary(customerId);
  return {
    previousDue: summary.outstandingDue,
    advanceBalance: summary.advanceBalance,
  };
};

const createSale = async (data, userId) => {
  const count = await Sale.countDocuments({ isDeleted: { $ne: true } });
  const invoiceNumber = generateInvoiceNumber('INV', count + 1);

  const items = data.items.map((item) => ({
    ...item,
    totalPrice: item.quantity * item.unitPrice,
  }));

  const totals = calculateTotals(
    items.map(i => ({ quantity: i.quantity, unitCost: i.unitPrice })),
    data.discount, data.taxRate, data.deliveryCharge, 0
  );

  const { previousDue, advanceBalance } = await getCustomerBalanceBeforeInvoice(data.customer);

  let advanceUsed = 0;
  let netPayable = totals.grandTotal;

  if (advanceBalance > 0) {
    advanceUsed = Math.min(advanceBalance, totals.grandTotal);
    netPayable = totals.grandTotal - advanceUsed;
  }

  const paymentReceivedAtInvoice = data.paidAmount || 0;
  const remainingDueAfterInvoice = Math.max(0, netPayable - paymentReceivedAtInvoice);

  const dueAmount = netPayable - paymentReceivedAtInvoice;

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
    paidAmount: paymentReceivedAtInvoice,
    dueAmount: Math.max(0, dueAmount),
    paymentMethod: data.paymentMethod || 'Cash',
    notes: data.notes || '',
    createdBy: userId,
    previousDue,
    advanceUsed,
    paymentReceivedAtInvoice,
    remainingDueAfterInvoice,
  });

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
        notes: `Sale: ${invoiceNumber}`,
        createdBy: userId,
      });
    }
  }

  return await Sale.findById(sale._id)
    .populate('customer', 'name company phone')
    .populate('items.product', 'productName sku sellingPrice');
};

const getSales = async (query) => {
  const features = new APIFeatures(
    Sale.find({ isDeleted: { $ne: true } })
      .populate('customer', 'name company phone')
      .populate('items.product', 'productName sku'),
    query
  ).search(['invoiceNumber']).filter().sort('-saleDate').paginate();

  const sales = await features.query;
  const total = await Sale.countDocuments(features.query._conditions);

  const allocations = await require('../models/CustomerPaymentAllocation').find().lean();

  const salesWithDue = sales.map(s => {
    const invoiceAllocations = allocations
      .filter(a => String(a.invoice) === String(s._id))
      .reduce((sum, a) => sum + a.allocatedAmount, 0);
    const paidAtCreation = s.paymentReceivedAtInvoice || 0;
    const totalPaidForInvoice = paidAtCreation + invoiceAllocations;
    const outstanding = Math.max(0, s.grandTotal - totalPaidForInvoice);

    return {
      ...s.toJSON(),
      outstandingDueAfterAllocations: outstanding,
      totalPaidWithAllocations: totalPaidForInvoice,
    };
  });

  return { data: salesWithDue, meta: features.getPaginationMeta(total) };
};

const getSaleById = async (id) => {
  const sale = await Sale.findById(id)
    .populate('customer', 'name company phone email address')
    .populate('items.product', 'productName sku brand modelNumber sellingPrice')
    .populate('createdBy', 'name');

  if (!sale || sale.isDeleted) throw Object.assign(new Error('Sale not found'), { statusCode: 404 });

  const allocations = await require('../models/CustomerPaymentAllocation')
    .find({ invoice: id })
    .populate({ path: 'payment', select: 'paymentNumber paymentDate amount paymentMethod' })
    .lean();

  const invoiceAllocations = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
  const paidAtCreation = sale.paymentReceivedAtInvoice || 0;
  const totalPaidForInvoice = paidAtCreation + invoiceAllocations;
  const outstanding = Math.max(0, sale.grandTotal - totalPaidForInvoice);

  return {
    ...sale.toJSON(),
    outstandingDueAfterAllocations: outstanding,
    totalPaidWithAllocations: totalPaidForInvoice,
    allocations,
  };
};

const updateSale = async (id, data, userId) => {
  const existing = await Sale.findById(id);
  if (!existing || existing.isDeleted) throw Object.assign(new Error('Sale not found'), { statusCode: 404 });

  for (const item of existing.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.currentStock += item.quantity;
      await product.save();
    }
  }

  await StockMovement.deleteMany({ reference: id, referenceModel: 'Sale' });

  const items = data.items.map(item => ({ ...item, totalPrice: item.quantity * item.unitPrice }));
  const totals = calculateTotals(
    items.map(i => ({ quantity: i.quantity, unitCost: i.unitPrice })),
    data.discount, data.taxRate, data.deliveryCharge, 0
  );

  const { previousDue, advanceBalance } = await getCustomerBalanceBeforeInvoice(data.customer);

  let advanceUsed = 0;
  let netPayable = totals.grandTotal;

  if (advanceBalance > 0) {
    advanceUsed = Math.min(advanceBalance, totals.grandTotal);
    netPayable = totals.grandTotal - advanceUsed;
  }

  const paymentReceivedAtInvoice = data.paidAmount || 0;
  const remainingDueAfterInvoice = Math.max(0, netPayable - paymentReceivedAtInvoice);
  const dueAmount = netPayable - paymentReceivedAtInvoice;

  const sale = await Sale.findByIdAndUpdate(id, {
    customer: data.customer,
    saleDate: data.saleDate || existing.saleDate,
    items,
    subtotal: totals.subtotal,
    discount: totals.totalDiscount,
    taxRate: data.taxRate || 0,
    taxAmount: totals.taxAmount,
    deliveryCharge: data.deliveryCharge || 0,
    grandTotal: totals.grandTotal,
    paidAmount: paymentReceivedAtInvoice,
    dueAmount: Math.max(0, dueAmount),
    paymentMethod: data.paymentMethod || 'Cash',
    notes: data.notes || '',
    previousDue,
    advanceUsed,
    paymentReceivedAtInvoice,
    remainingDueAfterInvoice,
  }, { new: true });

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
        notes: `Sale: ${sale.invoiceNumber}`,
        createdBy: userId,
      });
    }
  }

  return await Sale.findById(sale._id)
    .populate('customer', 'name company phone')
    .populate('items.product', 'productName sku sellingPrice');
};

const updateSaleStatus = async (id, status) => {
  const sale = await Sale.findByIdAndUpdate(id, { status }, { new: true });
  if (!sale) throw Object.assign(new Error('Sale not found'), { statusCode: 404 });
  return sale;
};

const deleteSale = async (id) => {
  const existing = await Sale.findById(id);
  if (!existing || existing.isDeleted) throw Object.assign(new Error('Sale not found'), { statusCode: 404 });

  for (const item of existing.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.currentStock += item.quantity;
      await product.save();
    }
  }

  await StockMovement.deleteMany({ reference: id, referenceModel: 'Sale' });

  existing.isDeleted = true;
  existing.deletedAt = new Date();
  await existing.save();

  return { message: 'Sale deleted successfully' };
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  updateSaleStatus,
  deleteSale,
};
