const { z } = require('zod');
const { EXPENSE_CATEGORIES } = require('../constants');

const createExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES, { message: 'Invalid expense category' }),
  amount: z.number().min(0, 'Amount cannot be negative'),
  description: z.string().optional().default(''),
  expenseDate: z.string().optional(),
  paymentMethod: z.string().optional().default('Cash'),
  reference: z.string().optional().default(''),
});

const updateExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  amount: z.number().min(0).optional(),
  description: z.string().optional(),
  expenseDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
});

module.exports = { createExpenseSchema, updateExpenseSchema };
