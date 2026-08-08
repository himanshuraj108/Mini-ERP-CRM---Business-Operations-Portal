import api from './axios';
import { ApiResponse, User } from '../types';

export async function login(email: string, password: string): Promise<{ accessToken: string; user: User }> {
  const response = await api.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/login', { email, password });
  return response.data.data!;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<User> {
  const response = await api.get<ApiResponse<User>>('/auth/me');
  return response.data.data!;
}
