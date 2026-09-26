const CustomerPayment = require('../models/CustomerPayment');
const CustomerPaymentAllocation = require('../models/CustomerPaymentAllocation');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Counter = require('../models/Counter');
const APIFeatures = require('../utils/apiFeatures');
const { generatePaymentNumber } = require('../utils/helpers');

const getCustomerFinancialSummary = async (customerId, excludeSaleId = null) => {
  const customer = await Customer.findById(customerId);
  if (!customer) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });

  const invoiceQuery = {
    customer: customerId,
    isDeleted: { $ne: true },
    status: { $ne: 'Cancelled' },
  };
  if (excludeSaleId) invoiceQuery._id = { $ne: excludeSaleId };

  const invoices = await Sale.find(invoiceQuery).sort({ saleDate: 1 }).lean();

  const payments = await CustomerPayment.find({
    customer: customerId,
    isDeleted: { $ne: true },
  })
    .sort({ paymentDate: 1 })
    .lean();

  const allocations = await CustomerPaymentAllocation.find().lean();

  const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPaidAtInvoice = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalSeparatePayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaidAmount = totalPaidAtInvoice + totalSeparatePayments;

  const netDue =
    customer.openingDue + totalInvoiceAmount - totalPaidAmount - customer.openingAdvance;

  return {
    customer,
    invoices,
    payments,
    allocations,
    totalInvoiceAmount,
    totalPaidAmount,
    totalPaidAtInvoice,
    totalSeparatePayments,
    openingDue: customer.openingDue,
    openingAdvance: customer.openingAdvance,
    outstandingDue: Math.max(0, netDue),
    advanceBalance: netDue < 0 ? Math.abs(netDue) : 0,
    netDue,
  };
};

const getInvoiceOutstandingAmount = (invoice, allocations) => {
  const invoiceAllocations = allocations
    .filter((a) => String(a.invoice) === String(invoice._id))
    .reduce((sum, a) => sum + a.allocatedAmount, 0);
  const paidAtCreation = invoice.paymentReceivedAtInvoice || 0;
  const advanceUsed = invoice.advanceUsed || 0;
  const totalPaid = paidAtCreation + invoiceAllocations + advanceUsed;
  return Math.max(0, invoice.grandTotal - totalPaid);
};

const createPayment = async (data, userId) => {
  let existing = await Counter.findOne({ key: 'payment_number' });
  if (!existing) {
    const result = await CustomerPayment.aggregate([
      { $match: { paymentNumber: { $exists: true, $ne: null } } },
      {
        $addFields: {
          paymentSeq: {
            $toInt: { $arrayElemAt: [{ $split: ['$paymentNumber', '-'] }, 1] },
          },
        },
      },
      { $sort: { paymentSeq: -1 } },
      { $limit: 1 },
      { $project: { _id: 0, paymentSeq: 1 } },
    ]);
    const startSeq = result[0]?.paymentSeq || 0;
    try {
      await Counter.create({ key: 'payment_number', seq: startSeq });
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }
  const counter = await Counter.findOneAndUpdate(
    { key: 'payment_number' },
    { $inc: { seq: 1 } },
    { new: true }
  );
  const paymentNumber = generatePaymentNumber('RCT', counter.seq);

  const summary = await getCustomerFinancialSummary(data.customer);
  const previousDue = summary.outstandingDue;
  const newDue = Math.max(0, summary.netDue - data.amount);

  const payment = await CustomerPayment.create({
    customer: data.customer,
    paymentNumber,
    paymentDate: data.paymentDate || new Date(),
    amount: data.amount,
    paymentMethod: data.paymentMethod || 'Cash',
    transactionId: data.transactionId || '',
    reference: data.reference || '',
    note: data.note || '',
    previousDue,
    newDue,
    receivedBy: userId,
  });

  await applyFIFOAllocation(data.customer, payment._id, data.amount);

  return await CustomerPayment.findById(payment._id)
    .populate('customer', 'name company phone')
    .populate('receivedBy', 'name');
};

const applyFIFOAllocation = async (customerId, paymentId, amount) => {
  const invoices = await Sale.find({
    customer: customerId,
    isDeleted: { $ne: true },
    status: { $ne: 'Cancelled' },
  })
    .sort({ saleDate: 1 })
    .lean();

  const allocations = await CustomerPaymentAllocation.find().lean();

  let remainingAmount = amount;

  for (const invoice of invoices) {
    if (remainingAmount <= 0) break;

    const outstanding = getInvoiceOutstandingAmount(invoice, allocations);
    if (outstanding <= 0) continue;

    const toAllocate = Math.min(remainingAmount, outstanding);

    const existingAllocation = allocations.find(
      (a) => String(a.payment) === String(paymentId) && String(a.invoice) === String(invoice._id)
    );

    if (existingAllocation) {
      await CustomerPaymentAllocation.findByIdAndUpdate(existingAllocation._id, {
        allocatedAmount: existingAllocation.allocatedAmount + toAllocate,
      });
    } else {
      await CustomerPaymentAllocation.create({
        payment: paymentId,
        invoice: invoice._id,
        allocatedAmount: toAllocate,
      });
    }

    remainingAmount -= toAllocate;
  }

  return remainingAmount;
};

const reverseAllocations = async (paymentId) => {
  await CustomerPaymentAllocation.deleteMany({ payment: paymentId });
};

const buildDueSnapshots = async (customerId) => {
  const customer = await Customer.findById(customerId).lean();
  if (!customer) return new Map();

  const invoices = await Sale.find({
    customer: customerId,
    isDeleted: { $ne: true },
    status: { $ne: 'Cancelled' },
  })
    .sort({ saleDate: 1 })
    .lean();

  const payments = await CustomerPayment.find({
    customer: customerId,
    isDeleted: { $ne: true },
  })
    .sort({ paymentDate: 1 })
    .lean();

  const transactions = [];
  for (const invoice of invoices) {
    transactions.push({
      sortKey: new Date(invoice.saleDate).getTime(),
      type: 'invoice',
      amount: invoice.grandTotal - (invoice.paidAmount || 0),
    });
  }
  for (const payment of payments) {
    transactions.push({
      sortKey: new Date(payment.paymentDate).getTime(),
      type: 'payment',
      paymentId: String(payment._id),
      amount: payment.amount,
    });
  }
  transactions.sort((a, b) => a.sortKey - b.sortKey);

  const snapshots = new Map();
  let balance = (customer.openingDue || 0) - (customer.openingAdvance || 0);

  for (const transaction of transactions) {
    if (transaction.type === 'invoice') {
      balance += transaction.amount;
      continue;
    }
    const previousDue = Math.max(0, balance);
    balance -= transaction.amount;
    snapshots.set(transaction.paymentId, {
      previousDue,
      newDue: Math.max(0, balance),
    });
  }

  return snapshots;
};

const backfillDueSnapshots = async (payments) => {
  const missing = payments.filter((p) => p.previousDue == null || p.newDue == null);
  if (!missing.length) return;

  const grouped = new Map();
  for (const payment of missing) {
    const customerId = String(payment.customer?._id || payment.customer);
    if (!customerId || customerId === 'undefined') continue;
    if (!grouped.has(customerId)) grouped.set(customerId, []);
    grouped.get(customerId).push(payment);
  }

  const operations = [];
  for (const [customerId, rows] of grouped) {
    const snapshots = await buildDueSnapshots(customerId);
    for (const row of rows) {
      const snapshot = snapshots.get(String(row._id));
      if (!snapshot) continue;
      row.previousDue = snapshot.previousDue;
      row.newDue = snapshot.newDue;
      operations.push({
        updateOne: {
          filter: { _id: row._id },
          update: { $set: { previousDue: snapshot.previousDue, newDue: snapshot.newDue } },
        },
      });
    }
  }

  if (operations.length) {
    try {
      await CustomerPayment.bulkWrite(operations);
    } catch (err) {
      // non-critical: values are already attached to the response
    }
  }
};

const getPayments = async (query) => {
  const features = new APIFeatures(
    CustomerPayment.find({ isDeleted: { $ne: true } })
      .populate('customer', 'name company phone')
      .populate('receivedBy', 'name'),
    query
  )
    .filter()
    .sort('-paymentDate')
    .paginate();

  const payments = await features.query;
  await backfillDueSnapshots(payments);
  const total = await CustomerPayment.countDocuments(features.query._conditions);
  return { data: payments, meta: features.getPaginationMeta(total) };
};

const getPaymentById = async (id) => {
  const payment = await CustomerPayment.findById(id)
    .populate('customer', 'name company phone email address')
    .populate('receivedBy', 'name');

  if (!payment || payment.isDeleted) {
    throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  }

  const allocations = await CustomerPaymentAllocation.find({ payment: id })
    .populate({ path: 'invoice', select: 'invoiceNumber grandTotal paidAmount dueAmount saleDate' })
    .lean();

  return { payment, allocations };
};

const updatePayment = async (id, data, userId) => {
  const payment = await CustomerPayment.findById(id);
  if (!payment || payment.isDeleted) {
    throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  }

  const oldAmount = payment.amount;

  const summary = await getCustomerFinancialSummary(payment.customer);
  const netDueWithoutPayment = summary.netDue + oldAmount;
  const nextAmount = data.amount !== undefined ? data.amount : oldAmount;

  const updateData = {};
  if (data.paymentDate) updateData.paymentDate = data.paymentDate;
  if (data.paymentMethod) updateData.paymentMethod = data.paymentMethod;
  if (data.transactionId !== undefined) updateData.transactionId = data.transactionId;
  if (data.reference !== undefined) updateData.reference = data.reference;
  if (data.note !== undefined) updateData.note = data.note;
  updateData.previousDue = Math.max(0, netDueWithoutPayment);
  updateData.newDue = Math.max(0, netDueWithoutPayment - nextAmount);

  if (data.amount !== undefined && data.amount !== oldAmount) {
    updateData.amount = data.amount;
  }

  const updatedPayment = await CustomerPayment.findByIdAndUpdate(id, updateData, { new: true });

  if (data.amount !== undefined && data.amount !== oldAmount) {
    await reverseAllocations(id);
    await applyFIFOAllocation(payment.customer, id, data.amount);
  }

  return await CustomerPayment.findById(updatedPayment._id)
    .populate('customer', 'name company phone')
    .populate('receivedBy', 'name');
};

const deletePayment = async (id) => {
  const payment = await CustomerPayment.findById(id);
  if (!payment || payment.isDeleted) {
    throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  }

  payment.isDeleted = true;
  payment.deletedAt = new Date();
  await payment.save();

  await CustomerPaymentAllocation.deleteMany({ payment: id });

  return { message: 'Payment deleted successfully' };
};

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getCustomerFinancialSummary,
  getInvoiceOutstandingAmount,
  applyFIFOAllocation,
  reverseAllocations,
};
