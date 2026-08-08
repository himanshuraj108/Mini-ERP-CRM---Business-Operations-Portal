import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').trim(),
  sku: z.string().min(2, 'SKU must be at least 2 characters').trim().toUpperCase(),
  category: z.string().trim().optional().or(z.literal('')),
  unit_price: z.number().positive('Unit price must be greater than 0'),
  current_stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  min_stock_alert: z.number().int().min(0).default(10),
  location: z.string().trim().optional().or(z.literal('')),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.string().optional().transform((val) => parseInt(val || '1', 10)),
  limit: z.string().optional().transform((val) => Math.min(parseInt(val || '20', 10), 100)),
  search: z.string().optional().default(''),
  category: z.string().optional().default(''),
  low_stock: z.string().optional().transform((val) => val === 'true'),
});

export const stockAdjustmentSchema = z.object({
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  movement_type: z.enum(['IN', 'OUT']),
  reason: z.string().min(2, 'Reason is required').trim(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
