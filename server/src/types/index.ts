export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'sales' | 'warehouse' | 'accounts';
  is_active: boolean;
  created_at: Date;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_number: string | null;
  customer_type: 'Retail' | 'Wholesale' | 'Distributor';
  address: string;
  status: 'Lead' | 'Active' | 'Inactive';
  follow_up_date: string | null;
  notes: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerFollowup {
  id: string;
  customer_id: string;
  note: string;
  created_by: string;
  created_at: Date;
  created_by_name?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  location: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface StockMovement {
  id: string;
  product_id: string;
  quantity: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
  created_by: string;
  created_at: Date;
  created_by_name?: string;
}

export interface Challan {
  id: string;
  challan_number: string;
  customer_id: string;
  customer_snapshot: Record<string, unknown>;
  total_quantity: number;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChallanItem {
  id: string;
  challan_id: string;
  product_id: string;
  product_snapshot: Record<string, unknown>;
  quantity: number;
  unit_price: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: User['role'];
  iat?: number;
  exp?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown[];
}
