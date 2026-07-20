const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { createCustomerSchema, updateCustomerSchema } = require('../validators/customer');

router.use(authenticate);

router.get('/',                   customerController.getCustomers);
router.post('/',                  validateBody(createCustomerSchema), customerController.createCustomer);
router.get('/:id',                customerController.getCustomerById);
router.put('/:id',                validateBody(updateCustomerSchema), customerController.updateCustomer);
router.delete('/:id',             customerController.deleteCustomer);

router.get('/:id/dashboard',     customerController.getCustomerDashboard);
router.get('/:id/ledger',         customerController.getCustomerLedger);
router.get('/:id/statement',      customerController.getCustomerStatement);
router.get('/:id/due',            customerController.getCustomerDue);
router.get('/:id/payments',       customerController.getCustomerPayments);
router.get('/:id/invoices',       customerController.getCustomerInvoices);

module.exports = router;
