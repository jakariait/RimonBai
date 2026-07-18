const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

const getDateRange = (period, startDate, endDate) => {
  const now = new Date();
  let start, end;

  switch (period) {
    case 'daily':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start.getTime() + 86400000);
      break;
    case 'weekly':
      const dayOfWeek = now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      end = new Date(start.getTime() + 7 * 86400000);
      break;
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      break;
    case 'custom':
      start = startDate ? new Date(startDate) : new Date(0);
      end = endDate ? new Date(endDate) : new Date();
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  return { start, end };
};

const getDashboardStats = async (period = 'monthly', startDate, endDate) => {
  const { start, end } = getDateRange(period, startDate, endDate);

  const salesAgg = await Sale.aggregate([
    { $match: { saleDate: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$grandTotal' },
        totalPaid: { $sum: '$paidAmount' },
        totalDue: { $sum: '$dueAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const purchaseAgg = await Purchase.aggregate([
    { $match: { purchaseDate: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: null,
        totalCost: { $sum: '$grandTotal' },
        totalPaid: { $sum: '$paidAmount' },
        totalDue: { $sum: '$dueAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const expenseAgg = await Expense.aggregate([
    { $match: { expenseDate: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const revenue = salesAgg[0]?.totalRevenue || 0;
  const cost = purchaseAgg[0]?.totalCost || 0;
  const expenses = expenseAgg[0]?.totalExpenses || 0;

  const salesData = await Sale.aggregate([
    { $match: { saleDate: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
        total: { $sum: '$grandTotal' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const purchaseData = await Purchase.aggregate([
    { $match: { purchaseDate: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$purchaseDate' } },
        total: { $sum: '$grandTotal' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const products = await Product.find();
  const inventoryValue = products.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0);
  const lowStockProducts = await Product.find({ $expr: { $lte: ['$currentStock', '$minimumStock'] }, currentStock: { $gt: 0 } }).limit(10);

  const recentSales = await Sale.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('customer', 'name')
    .populate('createdBy', 'name')
    .lean();

  const recentPurchases = await Purchase.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('supplier', 'companyName')
    .populate('createdBy', 'name')
    .lean();

  const customersOutstanding = await Customer.aggregate([
    { $group: { _id: null, total: { $sum: '$dueBalance' } } },
  ]);

  const suppliersOutstanding = await Supplier.aggregate([
    { $group: { _id: null, total: { $sum: '$outstandingBalance' } } },
  ]);

  return {
    revenue,
    totalCost: cost,
    grossProfit: revenue - cost,
    totalExpenses: expenses,
    netProfit: revenue - cost - expenses,
    totalSales: salesAgg[0]?.count || 0,
    totalPurchases: purchaseAgg[0]?.count || 0,
    outstandingReceivable: customersOutstanding[0]?.total || 0,
    outstandingPayable: suppliersOutstanding[0]?.total || 0,
    inventoryValue,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    recentSales,
    recentPurchases,
    salesChart: salesData,
    purchaseChart: purchaseData,
  };
};

const getProfitLoss = async (period = 'monthly', startDate, endDate) => {
  const { start, end } = getDateRange(period, startDate, endDate);

  const salesAgg = await Sale.aggregate([
    { $match: { saleDate: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$grandTotal' },
        totalDiscount: { $sum: '$discount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const cogsAgg = await Sale.aggregate([
    { $match: { saleDate: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: null,
        cogs: { $sum: { $multiply: ['$items.quantity', { $ifNull: ['$product.purchasePrice', 0] }] } },
      },
    },
  ]);

  const expenseAgg = await Expense.aggregate([
    { $match: { expenseDate: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$category',
        amount: { $sum: '$amount' },
      },
    },
    { $sort: { amount: -1 } },
  ]);

  const revenue = salesAgg[0]?.revenue || 0;
  const totalDiscount = salesAgg[0]?.totalDiscount || 0;
  const cogs = cogsAgg[0]?.cogs || 0;
  const grossProfit = revenue - cogs;
  const totalExpenses = expenseAgg.reduce((sum, e) => sum + e.amount, 0);

  return {
    period,
    startDate: start,
    endDate: end,
    revenue,
    totalDiscount,
    netRevenue: revenue - totalDiscount,
    cogs,
    grossProfit,
    grossProfitMargin: revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(2) : 0,
    expenses: expenseAgg,
    totalExpenses,
    netProfit: grossProfit - totalExpenses,
    netProfitMargin: revenue > 0 ? (((grossProfit - totalExpenses) / revenue) * 100).toFixed(2) : 0,
    isLoss: (grossProfit - totalExpenses) < 0,
  };
};

module.exports = { getDashboardStats, getProfitLoss, getDateRange };
