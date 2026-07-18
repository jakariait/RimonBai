const { z } = require('zod');

const purchaseItemSchema = z.object({
  product: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitCost: z.number().min(0, 'Unit cost cannot be negative'),
});

const createPurchaseSchema = z.object({
  supplier: z.string().min(1, 'Supplier is required'),
  purchaseDate: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
  discount: z.number().min(0).optional().default(0),
  taxRate: z.number().min(0).optional().default(0),
  shipping: z.number().min(0).optional().default(0),
  otherCosts: z.number().min(0).optional().default(0),
  paidAmount: z.number().min(0).optional().default(0),
  notes: z.string().optional().default(''),
});

module.exports = { createPurchaseSchema };
