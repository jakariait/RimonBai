const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const APIFeatures = require('../utils/apiFeatures');

const createCustomer = async (data) => {
  return Customer.create(data);
};

const getCustomers = async (query) => {
  const features = new APIFeatures(Customer.find(), query)
    .search(['name', 'company', 'phone', 'email'])
    .filter()
    .sort()
    .paginate();

  const customers = await features.query;
  const total = await Customer.countDocuments(features.query._conditions);
  return { data: customers, meta: features.getPaginationMeta(total) };
};

const getCustomerById = async (id) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
  }
  return customer;
};

const updateCustomer = async (id, data) => {
  const customer = await Customer.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!customer) {
    throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
  }
  return customer;
};

const deleteCustomer = async (id) => {
  const hasSales = await Sale.exists({ customer: id });
  if (hasSales) {
    throw Object.assign(new Error('Cannot delete customer with existing sales'), { statusCode: 400 });
  }
  const customer = await Customer.findByIdAndDelete(id);
  if (!customer) {
    throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
  }
  return customer;
};

const getCustomerLedger = async (id, query = {}) => {
  const customer = await getCustomerById(id);

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 50;

  const sales = await Sale.find({ customer: id })
    .sort({ saleDate: -1 })
    .populate('items.product', 'productName')
    .lean();

  const payments = await Payment.find({ customer: id })
    .sort({ paymentDate: -1 })
    .lean();

  const entries = [
    ...sales.map(s => ({
      date: s.saleDate,
      type: 'sale',
      reference: s.invoiceNumber,
      debit: s.grandTotal,
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
    customer,
    entries: paginatedEntries,
    meta: {
      total: ledgerEntries.length,
      page,
      limit,
      totalPages: Math.ceil(ledgerEntries.length / limit),
      currentBalance: customer.dueBalance,
    },
  };
};

module.exports = { createCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer, getCustomerLedger };
