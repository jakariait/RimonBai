const customerPaymentService = require('../services/customerPaymentService');
const { sendSuccess } = require('../utils/response');

const createPayment = async (req, res) => {
  const payment = await customerPaymentService.createPayment(req.body, req.user._id);
  sendSuccess(res, payment, 'Payment created successfully', 201);
};

const getPayments = async (req, res) => {
  const result = await customerPaymentService.getPayments(req.query);
  sendSuccess(res, result.data, 'Payments fetched successfully', 200, result.meta);
};

const getPaymentById = async (req, res) => {
  const result = await customerPaymentService.getPaymentById(req.params.id);
  sendSuccess(res, result, 'Payment fetched successfully');
};

const updatePayment = async (req, res) => {
  const payment = await customerPaymentService.updatePayment(req.params.id, req.body, req.user._id);
  sendSuccess(res, payment, 'Payment updated successfully');
};

const deletePayment = async (req, res) => {
  const result = await customerPaymentService.deletePayment(req.params.id);
  sendSuccess(res, result, 'Payment deleted successfully');
};

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
};
