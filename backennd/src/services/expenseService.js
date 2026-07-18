const Expense = require('../models/Expense');
const APIFeatures = require('../utils/apiFeatures');

const createExpense = async (data, userId) => {
  return Expense.create({ ...data, createdBy: userId });
};

const getExpenses = async (query) => {
  const features = new APIFeatures(Expense.find().populate('createdBy', 'name'), query)
    .search(['description', 'reference'])
    .filter()
    .sort('-expenseDate')
    .paginate();

  const expenses = await features.query;
  const total = await Expense.countDocuments(features.query._conditions);
  return { data: expenses, meta: features.getPaginationMeta(total) };
};

const getExpenseById = async (id) => {
  const expense = await Expense.findById(id).populate('createdBy', 'name');
  if (!expense) {
    throw Object.assign(new Error('Expense not found'), { statusCode: 404 });
  }
  return expense;
};

const updateExpense = async (id, data) => {
  const expense = await Expense.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!expense) {
    throw Object.assign(new Error('Expense not found'), { statusCode: 404 });
  }
  return expense;
};

const deleteExpense = async (id) => {
  const expense = await Expense.findByIdAndDelete(id);
  if (!expense) {
    throw Object.assign(new Error('Expense not found'), { statusCode: 404 });
  }
  return expense;
};

const getExpenseReports = async (startDate, endDate) => {
  const match = {};
  if (startDate || endDate) {
    match.expenseDate = {};
    if (startDate) match.expenseDate.$gte = new Date(startDate);
    if (endDate) match.expenseDate.$lte = new Date(endDate);
  }

  const reports = await Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const total = reports.reduce((sum, r) => sum + r.total, 0);

  return { reports, total };
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseReports,
};
