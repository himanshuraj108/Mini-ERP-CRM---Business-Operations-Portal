import api from './axios';
import { ApiResponse, Customer, CustomerFollowup, PaginatedResult } from '../types';

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customer_type?: string;
}

export async function getCustomers(filters: CustomerFilters = {}): Promise<PaginatedResult<Customer>> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.customer_type) params.set('customer_type', filters.customer_type);

  const response = await api.get<ApiResponse<PaginatedResult<Customer>>>(`/customers?${params.toString()}`);
  return response.data.data!;
}

export async function getCustomerById(id: string): Promise<Customer> {
  const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
  return response.data.data!;
}

export async function createCustomer(data: Partial<Customer>): Promise<Customer> {
  const response = await api.post<ApiResponse<Customer>>('/customers', data);
  return response.data.data!;
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
  const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
  return response.data.data!;
}

export async function deleteCustomer(id: string): Promise<void> {
  await api.delete(`/customers/${id}`);
}

export async function getFollowups(customerId: string): Promise<CustomerFollowup[]> {
  const response = await api.get<ApiResponse<CustomerFollowup[]>>(`/customers/${customerId}/followups`);
  return response.data.data!;
}

export async function addFollowup(customerId: string, note: string): Promise<CustomerFollowup> {
  const response = await api.post<ApiResponse<CustomerFollowup>>(`/customers/${customerId}/followups`, { note });
  return response.data.data!;
}
