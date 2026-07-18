const supplierService = require('../services/supplierService');
const { sendSuccess } = require('../utils/response');

const createSupplier = async (req, res) => {
  const supplier = await supplierService.createSupplier(req.body);
  sendSuccess(res, supplier, 'Supplier created successfully', 201);
};

const getSuppliers = async (req, res) => {
  const result = await supplierService.getSuppliers(req.query);
  sendSuccess(res, result.data, 'Suppliers fetched successfully', 200, result.meta);
};

const getSupplierById = async (req, res) => {
  const supplier = await supplierService.getSupplierById(req.params.id);
  sendSuccess(res, supplier);
};

const updateSupplier = async (req, res) => {
  const supplier = await supplierService.updateSupplier(req.params.id, req.body);
  sendSuccess(res, supplier, 'Supplier updated successfully');
};

const deleteSupplier = async (req, res) => {
  await supplierService.deleteSupplier(req.params.id);
  sendSuccess(res, null, 'Supplier deleted successfully');
};

const getSupplierLedger = async (req, res) => {
  const result = await supplierService.getSupplierLedger(req.params.id, req.query);
  sendSuccess(res, result, 'Supplier ledger fetched successfully');
};

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  getSupplierLedger,
};
