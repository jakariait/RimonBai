const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/suppliers', require('./suppliers'));
router.use('/customers', require('./customers'));
router.use('/products', require('./products'));
router.use('/categories', require('./categories'));
router.use('/purchases', require('./purchases'));
router.use('/sales', require('./sales'));
router.use('/expenses', require('./expenses'));
router.use('/inventory', require('./inventory'));
router.use('/analytics', require('./analytics'));
router.use('/settings', require('./settings'));
router.use('/customer-payments', require('./customerPayments'));

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

module.exports = router;
