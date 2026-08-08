import api from './axios';
import { ApiResponse, DashboardStats } from '../types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
  return response.data.data!;
}
