const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { createSupplierSchema, updateSupplierSchema } = require('../validators/supplier');

router.use(authenticate);

router.get('/', supplierController.getSuppliers);
router.post('/', validateBody(createSupplierSchema), supplierController.createSupplier);
router.get('/:id', supplierController.getSupplierById);
router.put('/:id', validateBody(updateSupplierSchema), supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);
router.get('/:id/ledger', supplierController.getSupplierLedger);

module.exports = router;
