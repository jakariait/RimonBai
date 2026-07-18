const { z } = require('zod');

const createSupplierSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().optional().default(''),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  status: z.enum(['Active', 'Inactive']).optional().default('Active'),
});

const updateSupplierSchema = z.object({
  companyName: z.string().min(1).optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
});

module.exports = { createSupplierSchema, updateSupplierSchema };
