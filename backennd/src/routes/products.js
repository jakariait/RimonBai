const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { createProductSchema, updateProductSchema } = require('../validators/product');

router.use(authenticate);

router.get('/', productController.getProducts);
router.post('/', validateBody(createProductSchema), productController.createProduct);
router.get('/:id', productController.getProductById);
router.put('/:id', validateBody(updateProductSchema), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.get('/:id/movements', productController.getStockMovements);
router.put('/:id/adjust-stock', productController.adjustStock);

module.exports = router;
