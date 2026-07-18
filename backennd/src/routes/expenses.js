const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { createExpenseSchema, updateExpenseSchema } = require('../validators/expense');

router.use(authenticate);

router.get('/', expenseController.getExpenses);
router.post('/', validateBody(createExpenseSchema), expenseController.createExpense);
router.get('/reports', expenseController.getExpenseReports);
router.get('/:id', expenseController.getExpenseById);
router.put('/:id', validateBody(updateExpenseSchema), expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
