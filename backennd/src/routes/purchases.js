const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { createPurchaseSchema } = require('../validators/purchase');

router.use(authenticate);

router.get('/', purchaseController.getPurchases);
router.post('/', validateBody(createPurchaseSchema), purchaseController.createPurchase);
router.get('/:id', purchaseController.getPurchaseById);
router.put('/:id/status', purchaseController.updatePurchaseStatus);

module.exports = router;
