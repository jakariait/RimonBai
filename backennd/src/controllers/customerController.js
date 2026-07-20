const customerService = require('../services/customerService');
const { sendSuccess } = require('../utils/response');

const createCustomer = async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  sendSuccess(res, customer, 'Customer created successfully', 201);
};

const getCustomers = async (req, res) => {
  const result = await customerService.getCustomers(req.query);
  sendSuccess(res, result.data, 'Customers fetched successfully', 200, result.meta);
};

const getCustomerById = async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  sendSuccess(res, customer);
};

const updateCustomer = async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  sendSuccess(res, customer, 'Customer updated successfully');
};

const deleteCustomer = async (req, res) => {
  await customerService.deleteCustomer(req.params.id);
  sendSuccess(res, null, 'Customer deleted successfully');
};

const getCustomerLedger = async (req, res) => {
  const result = await customerService.getCustomerLedger(req.params.id, req.query);
  sendSuccess(res, result, 'Customer ledger fetched successfully');
};

const getCustomerStatement = async (req, res) => {
  const result = await customerService.getCustomerStatement(req.params.id, req.query);
  sendSuccess(res, result, 'Customer statement fetched successfully');
};

const getCustomerDue = async (req, res) => {
  const result = await customerService.getCustomerDue(req.params.id);
  sendSuccess(res, result, 'Customer due fetched successfully');
};

const getCustomerPayments = async (req, res) => {
  const result = await customerService.getCustomerPayments(req.params.id, req.query);
  sendSuccess(res, result.data, 'Customer payments fetched successfully', 200, result.meta);
};

const getCustomerInvoices = async (req, res) => {
  const result = await customerService.getCustomerInvoices(req.params.id, req.query);
  sendSuccess(res, result.data, 'Customer invoices fetched successfully', 200, result.meta);
};

const getCustomerDashboard = async (req, res) => {
  const result = await customerService.getCustomerDashboard(req.params.id);
  sendSuccess(res, result, 'Customer dashboard fetched successfully');
};

module.exports = {
  createCustomer, getCustomers, getCustomerById,
  updateCustomer, deleteCustomer,
  getCustomerLedger, getCustomerStatement, getCustomerDue,
  getCustomerPayments, getCustomerInvoices, getCustomerDashboard,
};
