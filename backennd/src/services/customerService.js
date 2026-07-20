const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const CustomerPayment = require('../models/CustomerPayment');
const CustomerPaymentAllocation = require('../models/CustomerPaymentAllocation');
const APIFeatures = require('../utils/apiFeatures');
const customerPaymentService = require('./customerPaymentService');

const createCustomer = async (data) => {
  return Customer.create(data);
};

const getCustomers = async (query) => {
  const features = new APIFeatures(Customer.find({ isActive: true }), query)
    .search(['name', 'company', 'phone', 'email'])
    .filter().sort().paginate();

  const customers = await features.query;
  const total = await Customer.countDocuments(features.query._conditions);

  const customersWithDue = await Promise.all(
    customers.map(async (c) => {
      const summary = await customerPaymentService.getCustomerFinancialSummary(c._id);
      return {
        ...c.toJSON(),
        dueBalance: summary.outstandingDue,
        advanceBalance: summary.advanceBalance,
        totalSales: summary.totalInvoiceAmount,
        totalPaid: summary.totalPaidAmount,
      };
    })
  );

  return { data: customersWithDue, meta: features.getPaginationMeta(total) };
};

const getCustomerById = async (id) => {
  const customer = await Customer.findById(id);
  if (!customer) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });

  const summary = await customerPaymentService.getCustomerFinancialSummary(id);
  return {
    ...customer.toJSON(),
    dueBalance: summary.outstandingDue,
    advanceBalance: summary.advanceBalance,
    totalSales: summary.totalInvoiceAmount,
    totalPaid: summary.totalPaidAmount,
  };
};

const updateCustomer = async (id, data) => {
  const customer = await Customer.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!customer) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
  return customer;
};

const deleteCustomer = async (id) => {
  const hasSales = await Sale.exists({ customer: id, isDeleted: { $ne: true } });
  if (hasSales) throw Object.assign(new Error('Cannot delete customer with existing sales'), { statusCode: 400 });

  const customer = await Customer.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!customer) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
  return customer;
};

const getCustomerLedger = async (id, query = {}) => {
  const customer = await Customer.findById(id);
  if (!customer) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 50;

  const sales = await Sale.find({
    customer: id,
    isDeleted: { $ne: true },
    status: { $ne: 'Cancelled' },
  }).sort({ saleDate: 1 }).lean();

  const payments = await CustomerPayment.find({
    customer: id,
    isDeleted: { $ne: true },
  }).sort({ paymentDate: 1 }).lean();

  const entries = [];

  let runningBalance = customer.openingDue - customer.openingAdvance;

  entries.push({
    date: customer.createdAt,
    type: 'opening',
    reference: 'Opening Balance',
    description: 'Opening Due',
    debit: customer.openingDue,
    credit: 0,
    balance: customer.openingDue,
  });

  if (customer.openingAdvance > 0) {
    entries.push({
      date: customer.createdAt,
      type: 'opening',
      reference: 'Opening Advance',
      description: 'Opening Advance Balance',
      debit: 0,
      credit: customer.openingAdvance,
      balance: customer.openingDue - customer.openingAdvance,
    });
    runningBalance = customer.openingDue - customer.openingAdvance;
  }

  const allTransactions = [];

  for (const s of sales) {
    allTransactions.push({
      date: s.saleDate,
      sortKey: new Date(s.saleDate).getTime(),
      type: 'invoice',
      typeLabel: 'Invoice',
      reference: s.invoiceNumber,
      description: `Invoice #${s.invoiceNumber}`,
      debit: s.grandTotal,
      credit: 0,
      _id: s._id,
    });
    if (s.paidAmount > 0) {
      allTransactions.push({
        date: s.saleDate,
        sortKey: new Date(s.saleDate).getTime() + 1,
        type: 'payment',
        typeLabel: 'Payment',
        reference: s.invoiceNumber,
        description: `Payment at Invoice #${s.invoiceNumber}`,
        debit: 0,
        credit: s.paidAmount,
        _id: s._id,
      });
    }
  }

  for (const p of payments) {
    allTransactions.push({
      date: p.paymentDate,
      sortKey: new Date(p.paymentDate).getTime(),
      type: 'payment',
      typeLabel: 'Payment',
      reference: p.paymentNumber,
      description: `Payment #${p.paymentNumber} (${p.paymentMethod})`,
      debit: 0,
      credit: p.amount,
      _id: p._id,
    });
  }

  allTransactions.sort((a, b) => a.sortKey - b.sortKey);

  for (const t of allTransactions) {
    runningBalance = runningBalance + t.debit - t.credit;
    entries.push({
      date: t.date,
      type: t.type,
      typeLabel: t.typeLabel,
      reference: t.reference,
      description: t.description,
      debit: t.debit,
      credit: t.credit,
      balance: runningBalance,
    });
  }

  const start = (page - 1) * limit;
  const paginatedEntries = entries.slice(start, start + limit);

  return {
    customer: { ...customer.toJSON() },
    entries: paginatedEntries,
    totalEntries: entries.length,
    openingBalance: customer.openingDue - customer.openingAdvance,
    closingBalance: runningBalance,
    meta: {
      total: entries.length,
      page,
      limit,
      totalPages: Math.ceil(entries.length / limit),
    },
  };
};

const getCustomerStatement = async (id, query = {}) => {
  const customer = await Customer.findById(id);
  if (!customer) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });

  const fromDate = query.from ? new Date(query.from) : new Date(0);
  const toDate = query.to ? new Date(query.to) : new Date('2099-12-31');

  const sales = await Sale.find({
    customer: id,
    isDeleted: { $ne: true },
    status: { $ne: 'Cancelled' },
    saleDate: { $gte: fromDate, $lte: toDate },
  }).sort({ saleDate: 1 }).lean();

  const payments = await CustomerPayment.find({
    customer: id,
    isDeleted: { $ne: true },
    paymentDate: { $gte: fromDate, $lte: toDate },
  }).sort({ paymentDate: 1 }).lean();

  const entries = [];

  let runningBalance = customer.openingDue - customer.openingAdvance;

  entries.push({
    date: customer.createdAt,
    type: 'opening',
    reference: 'Opening Balance',
    description: 'Opening Balance',
    debit: 0,
    credit: 0,
    balance: runningBalance,
  });

  const allTransactions = [];

  for (const s of sales) {
    allTransactions.push({
      date: s.saleDate,
      sortKey: new Date(s.saleDate).getTime(),
      type: 'invoice',
      reference: s.invoiceNumber,
      description: `Invoice #${s.invoiceNumber}`,
      debit: s.grandTotal,
      credit: 0,
    });
    if (s.paidAmount > 0) {
      allTransactions.push({
        date: s.saleDate,
        sortKey: new Date(s.saleDate).getTime() + 1,
        type: 'payment',
        reference: s.invoiceNumber,
        description: `Payment at Invoice #${s.invoiceNumber}`,
        debit: 0,
        credit: s.paidAmount,
      });
    }
  }

  for (const p of payments) {
    allTransactions.push({
      date: p.paymentDate,
      sortKey: new Date(p.paymentDate).getTime(),
      type: 'payment',
      reference: p.paymentNumber,
      description: `Payment #${p.paymentNumber} (${p.paymentMethod})`,
      debit: 0,
      credit: p.amount,
    });
  }

  allTransactions.sort((a, b) => a.sortKey - b.sortKey);

  for (const t of allTransactions) {
    runningBalance = runningBalance + t.debit - t.credit;
    entries.push({
      date: t.date,
      type: t.type,
      reference: t.reference,
      description: t.description,
      debit: t.debit,
      credit: t.credit,
      balance: runningBalance,
    });
  }

  const totalInvoiced = sales.reduce((s, i) => s + i.grandTotal, 0);
  const totalPaidAtInvoice = sales.reduce((s, i) => s + (i.paidAmount || 0), 0);
  const totalSeparatePayments = payments.reduce((s, p) => s + p.amount, 0);
  const totalPaid = totalPaidAtInvoice + totalSeparatePayments;

  return {
    customer: { ...customer.toJSON() },
    entries,
    fromDate,
    toDate,
    openingBalance: customer.openingDue - customer.openingAdvance,
    closingBalance: runningBalance,
    totalInvoiced,
    totalPaid,
  };
};

const getCustomerDue = async (id) => {
  const summary = await customerPaymentService.getCustomerFinancialSummary(id);
  return summary;
};

const getCustomerPayments = async (id, query = {}) => {
  const features = new APIFeatures(
    CustomerPayment.find({ customer: id, isDeleted: { $ne: true } })
      .populate('receivedBy', 'name')
      .sort('-paymentDate'),
    query
  ).paginate();

  const payments = await features.query;
  const total = await CustomerPayment.countDocuments(features.query._conditions);

  return { data: payments, meta: features.getPaginationMeta(total) };
};

const getCustomerInvoices = async (id, query = {}) => {
  const features = new APIFeatures(
    Sale.find({ customer: id, isDeleted: { $ne: true } })
      .populate('items.product', 'productName sku')
      .sort('-saleDate'),
    query
  ).paginate();

  const sales = await features.query;
  const total = await Sale.countDocuments(features.query._conditions);

  const allocations = await CustomerPaymentAllocation.find().lean();
  const salesWithDue = sales.map(s => {
    const invoiceAllocations = allocations
      .filter(a => String(a.invoice) === String(s._id))
      .reduce((sum, a) => sum + a.allocatedAmount, 0);
    const paidAtCreation = s.paymentReceivedAtInvoice || 0;
    const totalPaid = paidAtCreation + invoiceAllocations;
    const outstanding = Math.max(0, s.grandTotal - totalPaid);

    return {
      ...s.toJSON(),
      outstandingDue: outstanding,
      allocatedAmount: invoiceAllocations,
    };
  });

  return { data: salesWithDue, meta: features.getPaginationMeta(total) };
};

const getCustomerDashboard = async (id) => {
  const customer = await Customer.findById(id);
  if (!customer) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });

  const summary = await customerPaymentService.getCustomerFinancialSummary(id);

  const invoices = await Sale.find({
    customer: id,
    isDeleted: { $ne: true },
    status: { $ne: 'Cancelled' },
  }).sort({ saleDate: -1 }).lean();

  const payments = await CustomerPayment.find({
    customer: id,
    isDeleted: { $ne: true },
  }).sort({ paymentDate: -1 }).lean();

  const allocations = await CustomerPaymentAllocation.find().lean();

  const lifetimeSales = invoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalPaidAtInvoice = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
  const totalSeparatePayments = payments.reduce((s, p) => s + p.amount, 0);
  const totalPaid = totalPaidAtInvoice + totalSeparatePayments;

  const invoicesWithStatus = invoices.map(inv => {
    const invoiceAllocations = allocations
      .filter(a => String(a.invoice) === String(inv._id))
      .reduce((sum, a) => sum + a.allocatedAmount, 0);
    const paidAtCreation = inv.paymentReceivedAtInvoice || 0;
    const totalPaidForInvoice = paidAtCreation + invoiceAllocations;
    const outstanding = Math.max(0, inv.grandTotal - totalPaidForInvoice);

    let invStatus = 'due';
    if (outstanding === 0) invStatus = 'paid';
    else if (totalPaidForInvoice > 0) invStatus = 'partial';

    return { ...inv, outstandingDue: outstanding, paidAmount: totalPaidForInvoice, invStatus };
  });

  const outstandingInvoices = invoicesWithStatus.filter(i => i.invStatus === 'due' || i.invStatus === 'partial');
  const paidInvoices = invoicesWithStatus.filter(i => i.invStatus === 'paid');
  const partiallyPaidInvoices = invoicesWithStatus.filter(i => i.invStatus === 'partial');

  const lastPayment = payments.length > 0 ? payments[0] : null;

  return {
    customer: {
      ...customer.toJSON(),
      dueBalance: summary.outstandingDue,
      advanceBalance: summary.advanceBalance,
      totalSales: lifetimeSales,
      totalPaid,
    },
    summary: {
      openingDue: customer.openingDue,
      openingAdvance: customer.openingAdvance,
      previousDue: summary.outstandingDue,
      lifetimeSales,
      totalPaid,
      outstandingDue: summary.outstandingDue,
      advanceBalance: summary.advanceBalance,
      lastPaymentDate: lastPayment?.paymentDate || null,
      numberOfInvoices: invoices.length,
      numberOfPayments: payments.length,
    },
    invoices: invoicesWithStatus,
    payments,
    outstandingInvoices,
    paidInvoices,
    partiallyPaidInvoices,
  };
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerLedger,
  getCustomerStatement,
  getCustomerDue,
  getCustomerPayments,
  getCustomerInvoices,
  getCustomerDashboard,
};
