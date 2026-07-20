const { z } = require('zod');

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  company: z.string().optional().default(''),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  openingDue: z.number().min(0).optional().default(0),
  openingAdvance: z.number().min(0).optional().default(0),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
  openingDue: z.number().min(0).optional(),
  openingAdvance: z.number().min(0).optional(),
});

module.exports = { createCustomerSchema, updateCustomerSchema };
