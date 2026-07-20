const generateSKU = (category, brand, index) => {
  const prefix = (category?.substring(0, 3) || 'GEN').toUpperCase();
  const brandPrefix = (brand?.substring(0, 2) || 'XX').toUpperCase();
  const num = String(index).padStart(4, '0');
  return `${prefix}-${brandPrefix}-${num}`;
};

const generateInvoiceNumber = (prefix = 'INV', count) => {
  const num = String(count).padStart(6, '0');
  return `${prefix}-${num}`;
};

const generatePurchaseNumber = (prefix = 'PUR', count) => {
  const num = String(count).padStart(6, '0');
  return `${prefix}-${num}`;
};

const generatePaymentNumber = (prefix = 'RCT', count) => {
  const num = String(count).padStart(6, '0');
  return `${prefix}-${num}`;
};

const calculateTotals = (items, discount = 0, taxRate = 0, shipping = 0, otherCosts = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const totalDiscount = typeof discount === 'number' ? discount : 0;
  const taxAmount = (subtotal - totalDiscount) * (taxRate / 100);
  const grandTotal = subtotal - totalDiscount + taxAmount + shipping + otherCosts;

  return { subtotal, totalDiscount, taxAmount, grandTotal };
};

const paginateQuery = (query, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

const getPaginationMeta = (total, page = 1, limit = 20) => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
};

module.exports = {
  generateSKU,
  generateInvoiceNumber,
  generatePurchaseNumber,
  generatePaymentNumber,
  calculateTotals,
  paginateQuery,
  getPaginationMeta,
};
