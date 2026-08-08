import api from './axios';
import { ApiResponse, Product, StockMovement, PaginatedResult } from '../types';

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  low_stock?: boolean;
}

export async function getProducts(filters: ProductFilters = {}): Promise<PaginatedResult<Product>> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.low_stock) params.set('low_stock', 'true');

  const response = await api.get<ApiResponse<PaginatedResult<Product>>>(`/products?${params.toString()}`);
  return response.data.data!;
}

export async function getProductById(id: string): Promise<Product> {
  const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
  return response.data.data!;
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  const response = await api.post<ApiResponse<Product>>('/products', data);
  return response.data.data!;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<Product> {
  const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
  return response.data.data!;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function getStockMovements(productId: string): Promise<StockMovement[]> {
  const response = await api.get<ApiResponse<StockMovement[]>>(`/products/${productId}/stock-movements`);
  return response.data.data!;
}

export async function adjustStock(
  productId: string,
  data: { quantity: number; movement_type: 'IN' | 'OUT'; reason: string }
): Promise<Product> {
  const response = await api.post<ApiResponse<Product>>(`/products/${productId}/stock`, data);
  return response.data.data!;
}
