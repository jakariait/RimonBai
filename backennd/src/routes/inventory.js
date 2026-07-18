const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/summary', inventoryController.getInventorySummary);
router.get('/low-stock', inventoryController.getLowStockProducts);
router.get('/out-of-stock', inventoryController.getOutOfStockProducts);
router.get('/movements', inventoryController.getStockMovementsReport);

module.exports = router;
