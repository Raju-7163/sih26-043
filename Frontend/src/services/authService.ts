import { apiClient } from './apiClient';
import { AuthResponse, User, UserRole } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  organization_name?: string;
  org_id?: number;
}

export interface LoginPayload {
  email: string;
  password: string;
  role: UserRole;
}

export interface DemoAccount {
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', payload);
    return res.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', payload);
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  async updateProfile(payload: { name?: string; organization_name?: string }): Promise<{ message: string; user: User }> {
    const res = await apiClient.put<{ message: string; user: User }>('/auth/me', payload);
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Clear client session anyway
    }
  },

  async getDemoAccounts(): Promise<{ enabled: boolean; accounts: DemoAccount[] }> {
    const res = await apiClient.get<{ enabled: boolean; accounts: DemoAccount[] }>('/auth/demo');
    return res.data;
  },
};
