const expenseService = require('../services/expenseService');
const { sendSuccess } = require('../utils/response');

const createExpense = async (req, res) => {
  const expense = await expenseService.createExpense(req.body, req.user._id);
  sendSuccess(res, expense, 'Expense created successfully', 201);
};

const getExpenses = async (req, res) => {
  const result = await expenseService.getExpenses(req.query);
  sendSuccess(res, result.data, 'Expenses fetched successfully', 200, result.meta);
};

const getExpenseById = async (req, res) => {
  const expense = await expenseService.getExpenseById(req.params.id);
  sendSuccess(res, expense);
};

const updateExpense = async (req, res) => {
  const expense = await expenseService.updateExpense(req.params.id, req.body);
  sendSuccess(res, expense, 'Expense updated successfully');
};

const deleteExpense = async (req, res) => {
  await expenseService.deleteExpense(req.params.id);
  sendSuccess(res, null, 'Expense deleted successfully');
};

const getExpenseReports = async (req, res) => {
  const result = await expenseService.getExpenseReports(req.query.startDate, req.query.endDate);
  sendSuccess(res, result, 'Expense report fetched successfully');
};

module.exports = { createExpense, getExpenses, getExpenseById, updateExpense, deleteExpense, getExpenseReports };
