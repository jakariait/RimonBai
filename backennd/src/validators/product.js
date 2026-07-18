const { z } = require('zod');
const { PRODUCT_UNITS } = require('../constants');

const createProductSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  sku: z.string().optional().default(''),
  brand: z.string().optional().default(''),
  modelNumber: z.string().optional().default(''),
  serialNumber: z.string().optional().default(''),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  currentStock: z.number().min(0).optional().default(0),
  minimumStock: z.number().min(0).optional().default(5),
  warranty: z.string().optional().default(''),
  barcode: z.string().optional().default(''),
  unit: z.enum(PRODUCT_UNITS).optional().default('Piece'),
  description: z.string().optional().default(''),
});

const updateProductSchema = z.object({
  productName: z.string().min(1).optional(),
  sku: z.string().optional(),
  brand: z.string().optional(),
  modelNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  currentStock: z.number().min(0).optional(),
  minimumStock: z.number().min(0).optional(),
  warranty: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.enum(PRODUCT_UNITS).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

module.exports = { createProductSchema, updateProductSchema };
