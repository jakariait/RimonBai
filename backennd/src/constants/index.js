const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SALES: 'sales',
  ACCOUNTANT: 'accountant',
};

const ROLES_ARRAY = Object.values(ROLES);

const ROLES_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: [ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTANT],
  [ROLES.ADMIN]: [ROLES.SALES, ROLES.ACCOUNTANT],
  [ROLES.SALES]: [],
  [ROLES.ACCOUNTANT]: [],
};

const EXPENSE_CATEGORIES = [
  'Office',
  'Salary',
  'Marketing',
  'Electricity',
  'Internet',
  'Transport',
  'Others',
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Card', 'Mobile Banking'];

const PRODUCT_UNITS = ['Piece', 'Box', 'Pack', 'Set', 'Pair', 'Dozen', 'Roll', 'Bottle', 'Kit'];

const SALE_STATUSES = ['Pending', 'Completed', 'Cancelled'];

const PURCHASE_STATUSES = ['Pending', 'Completed', 'Cancelled'];

module.exports = {
  ROLES,
  ROLES_ARRAY,
  ROLES_HIERARCHY,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  PRODUCT_UNITS,
  SALE_STATUSES,
  PURCHASE_STATUSES,
};
