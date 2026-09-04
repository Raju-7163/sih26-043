import { apiClient } from './apiClient';
import { AppNotification } from '../types';

export const notificationService = {
  async getNotifications(params?: { recipient_type?: string; recipient_name?: string }): Promise<AppNotification[]> {
    const res = await apiClient.get<AppNotification[]>('/api/problems/notifications', { params });
    return res.data;
  },

  async markAsRead(notificationId: number): Promise<{ message: string; notification: AppNotification }> {
    const res = await apiClient.put<{ message: string; notification: AppNotification }>(
      `/api/problems/notifications/${notificationId}/read`
    );
    return res.data;
  },

  async createNotification(payload: {
    recipient_type: string;
    recipient_name?: string;
    notification_type: string;
    title: string;
    message: string;
    problem_id?: number;
    project_id?: number;
  }): Promise<{ message: string; notification: AppNotification }> {
    const res = await apiClient.post('/api/problems/notifications', payload);
    return res.data;
  },
};
