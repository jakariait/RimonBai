const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { createSaleSchema } = require('../validators/sale');

router.use(authenticate);

router.get('/', saleController.getSales);
router.post('/', validateBody(createSaleSchema), saleController.createSale);
router.get('/:id', saleController.getSaleById);
router.put('/:id', validateBody(createSaleSchema), saleController.updateSale);
router.put('/:id/status', saleController.updateSaleStatus);
router.delete('/:id', saleController.deleteSale);

module.exports = router;
