const express = require('express');
const router = express.Router();
const customerPaymentController = require('../controllers/customerPaymentController');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const {
  createCustomerPaymentSchema,
  updateCustomerPaymentSchema,
} = require('../validators/customerPayment');

router.use(authenticate);

router.get('/', customerPaymentController.getPayments);
router.post(
  '/',
  validateBody(createCustomerPaymentSchema),
  customerPaymentController.createPayment
);
router.get('/:id', customerPaymentController.getPaymentById);
router.put(
  '/:id',
  validateBody(updateCustomerPaymentSchema),
  customerPaymentController.updatePayment
);
router.delete('/:id', customerPaymentController.deletePayment);

module.exports = router;
