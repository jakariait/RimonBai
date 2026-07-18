const { z } = require('zod');
const { PAYMENT_METHODS } = require('../constants');

const saleItemSchema = z.object({
  product: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
});

const createSaleSchema = z.object({
  customer: z.string().min(1, 'Customer is required'),
  saleDate: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  discount: z.number().min(0).optional().default(0),
  taxRate: z.number().min(0).optional().default(0),
  deliveryCharge: z.number().min(0).optional().default(0),
  paidAmount: z.number().min(0).optional().default(0),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().default('Cash'),
  notes: z.string().optional().default(''),
});

module.exports = { createSaleSchema };
