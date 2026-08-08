import { z } from 'zod';

export const challanItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

export const createChallanSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  items: z
    .array(challanItemSchema)
    .min(1, 'A challan must have at least one product'),
  status: z.enum(['Draft', 'Confirmed']).default('Draft'),
});

export const challanQuerySchema = z.object({
  page: z.string().optional().transform((val) => parseInt(val || '1', 10)),
  limit: z.string().optional().transform((val) => Math.min(parseInt(val || '20', 10), 100)),
  search: z.string().optional().default(''),
  status: z.enum(['Draft', 'Confirmed', 'Cancelled', '']).optional().default(''),
  customer_id: z.string().optional().default(''),
  from_date: z.string().optional().default(''),
  to_date: z.string().optional().default(''),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type ChallanQueryInput = z.infer<typeof challanQuerySchema>;
