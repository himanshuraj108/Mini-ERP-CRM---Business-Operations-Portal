export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'warehouse' | 'accounts';
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
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerFollowup {
  id: string;
  customer_id: string;
  note: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  quantity: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

export interface ChallanItem {
  id: string;
  challan_id: string;
  product_id: string;
  product_snapshot: {
    id: string;
    name: string;
    sku: string;
    unit_price: number;
  };
  quantity: number;
  unit_price: number;
}

export interface Challan {
  id: string;
  challan_number: string;
  customer_id: string;
  customer_snapshot: {
    id: string;
    name: string;
    mobile: string;
    address: string;
    business_name: string;
  };
  customer_name?: string;
  total_quantity: number;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  items?: ChallanItem[];
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
  details?: Array<{ field: string; message: string }>;
}

export interface DashboardStats {
  customers: { total: string; active: string; leads: string };
  products: { total: string; low_stock: string };
  challans: { total: string; confirmed: string; draft: string };
  recentChallans: Challan[];
  lowStockProducts: Product[];
}
