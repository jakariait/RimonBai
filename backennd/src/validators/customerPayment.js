const { z } = require('zod');
const { PAYMENT_METHODS } = require('../constants');

const createCustomerPaymentSchema = z.object({
  customer: z.string().min(1, 'Customer is required'),
  paymentDate: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().default('Cash'),
  transactionId: z.string().optional().default(''),
  reference: z.string().optional().default(''),
  note: z.string().optional().default(''),
});

const updateCustomerPaymentSchema = z.object({
  paymentDate: z.string().optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  transactionId: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
});

module.exports = { createCustomerPaymentSchema, updateCustomerPaymentSchema };
