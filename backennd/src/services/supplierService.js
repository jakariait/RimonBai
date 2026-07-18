const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const APIFeatures = require('../utils/apiFeatures');

const createSupplier = async (data) => {
  return Supplier.create(data);
};

const getSuppliers = async (query) => {
  const features = new APIFeatures(Supplier.find(), query)
    .search(['companyName', 'contactPerson', 'phone', 'email'])
    .filter()
    .sort()
    .paginate();

  const suppliers = await features.query;
  const total = await Supplier.countDocuments(features.query._conditions);
  return { data: suppliers, meta: features.getPaginationMeta(total) };
};

const getSupplierById = async (id) => {
  const supplier = await Supplier.findById(id);
  if (!supplier) {
    throw Object.assign(new Error('Supplier not found'), { statusCode: 404 });
  }
  return supplier;
};

const updateSupplier = async (id, data) => {
  const supplier = await Supplier.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!supplier) {
    throw Object.assign(new Error('Supplier not found'), { statusCode: 404 });
  }
  return supplier;
};

const deleteSupplier = async (id) => {
  const hasPurchases = await Purchase.exists({ supplier: id });
  if (hasPurchases) {
    throw Object.assign(new Error('Cannot delete supplier with existing purchases'), { statusCode: 400 });
  }
  const supplier = await Supplier.findByIdAndDelete(id);
  if (!supplier) {
    throw Object.assign(new Error('Supplier not found'), { statusCode: 404 });
  }
  return supplier;
};

const getSupplierLedger = async (id, query = {}) => {
  const supplier = await getSupplierById(id);

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 50;

  const purchases = await Purchase.find({ supplier: id })
    .sort({ purchaseDate: -1 })
    .populate('items.product', 'productName')
    .lean();

  const payments = await Payment.find({ supplier: id })
    .sort({ paymentDate: -1 })
    .lean();

  const entries = [
    ...purchases.map(p => ({
      date: p.purchaseDate,
      type: 'purchase',
      reference: p.purchaseNumber,
      debit: p.grandTotal,
      credit: 0,
      balance: 0,
    })),
    ...payments.map(p => ({
      date: p.paymentDate,
      type: 'payment',
      reference: p._id,
      debit: 0,
      credit: p.amount,
      balance: 0,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  let balance = 0;
  const ledgerEntries = entries.reverse().map(e => {
    balance += e.debit - e.credit;
    return { ...e, balance };
  }).reverse();

  const start = (page - 1) * limit;
  const paginatedEntries = ledgerEntries.slice(start, start + limit);

  return {
    supplier,
    entries: paginatedEntries,
    meta: {
      total: ledgerEntries.length,
      page,
      limit,
      totalPages: Math.ceil(ledgerEntries.length / limit),
      currentBalance: supplier.outstandingBalance,
    },
  };
};

module.exports = { createSupplier, getSuppliers, getSupplierById, updateSupplier, deleteSupplier, getSupplierLedger };
