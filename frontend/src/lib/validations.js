import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const supplierSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactPerson: z.string().optional().default(""),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional().default(""),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export const productSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  sku: z.string().optional().default(""),
  brand: z.string().optional().default(""),
  modelNumber: z.string().optional().default(""),
  serialNumber: z.string().optional().default(""),
  purchasePrice: z.coerce.number().min(0, "Must be positive"),
  sellingPrice: z.coerce.number().min(0, "Must be positive"),
  currentStock: z.coerce.number().min(0).optional().default(0),
  minimumStock: z.coerce.number().min(0).optional().default(5),
  warranty: z.string().optional().default(""),
  barcode: z.string().optional().default(""),
  unit: z.string().optional().default("Piece"),
  description: z.string().optional().default(""),
});

export const expenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  description: z.string().optional().default(""),
  expenseDate: z.string().optional(),
  paymentMethod: z.string().optional().default("Cash"),
  reference: z.string().optional().default(""),
});
