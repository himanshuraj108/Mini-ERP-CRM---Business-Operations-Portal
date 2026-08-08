import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  mobile: z.string().min(10, 'Enter a valid mobile number').trim(),
  email: z.string().email('Enter a valid email').toLowerCase().trim().optional().or(z.literal('')),
  business_name: z.string().trim().optional().or(z.literal('')),
  gst_number: z.string().trim().optional().or(z.literal('')),
  customer_type: z.enum(['Retail', 'Wholesale', 'Distributor']),
  address: z.string().trim().optional().or(z.literal('')),
  status: z.enum(['Lead', 'Active', 'Inactive']).default('Lead'),
  follow_up_date: z.string().datetime({ offset: true }).optional().or(z.literal('')).nullable(),
  notes: z.string().trim().optional().or(z.literal('')),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerQuerySchema = z.object({
  page: z.string().optional().transform((val) => parseInt(val || '1', 10)),
  limit: z.string().optional().transform((val) => Math.min(parseInt(val || '20', 10), 100)),
  search: z.string().optional().default(''),
  status: z.enum(['Lead', 'Active', 'Inactive', '']).optional().default(''),
  customer_type: z.enum(['Retail', 'Wholesale', 'Distributor', '']).optional().default(''),
});

export const addFollowupSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty').trim(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
export type AddFollowupInput = z.infer<typeof addFollowupSchema>;
