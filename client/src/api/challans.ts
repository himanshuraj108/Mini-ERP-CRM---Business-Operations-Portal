import api from './axios';
import { ApiResponse, Challan, PaginatedResult } from '../types';

export interface ChallanFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customer_id?: string;
  from_date?: string;
  to_date?: string;
}

export interface CreateChallanPayload {
  customer_id: string;
  items: Array<{ product_id: string; quantity: number }>;
  status: 'Draft' | 'Confirmed';
}

export async function getChallans(filters: ChallanFilters = {}): Promise<PaginatedResult<Challan>> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.customer_id) params.set('customer_id', filters.customer_id);
  if (filters.from_date) params.set('from_date', filters.from_date);
  if (filters.to_date) params.set('to_date', filters.to_date);

  const response = await api.get<ApiResponse<PaginatedResult<Challan>>>(`/challans?${params.toString()}`);
  return response.data.data!;
}

export async function getChallanById(id: string): Promise<Challan> {
  const response = await api.get<ApiResponse<Challan>>(`/challans/${id}`);
  return response.data.data!;
}

export async function createChallan(data: CreateChallanPayload): Promise<Challan> {
  const response = await api.post<ApiResponse<Challan>>('/challans', data);
  return response.data.data!;
}

export async function confirmChallan(id: string): Promise<Challan> {
  const response = await api.patch<ApiResponse<Challan>>(`/challans/${id}/confirm`);
  return response.data.data!;
}

export async function cancelChallan(id: string): Promise<Challan> {
  const response = await api.patch<ApiResponse<Challan>>(`/challans/${id}/cancel`);
  return response.data.data!;
}
