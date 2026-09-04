import { apiClient } from './apiClient';
import { Impact } from '../types';

export const impactService = {
  async addImpactMetric(
    projectId: number,
    payload: {
      metric_name: string;
      target_value?: number;
      current_value?: number;
      unit?: string;
      people_impacted?: number;
      areas_covered?: number;
      description?: string;
    }
  ): Promise<{ message: string; impact: Impact }> {
    const res = await apiClient.post(`/api/problems/projects/${projectId}/impact`, null, {
      params: payload,
    });
    return res.data;
  },

  async getAllImpacts(): Promise<Impact[]> {
    const res = await apiClient.get<any>('/api/problems/impact/all');
    return Array.isArray(res.data) ? res.data : (res.data?.impact_metrics || []);
  },

  async getProjectImpacts(projectId: number): Promise<Impact[]> {
    const res = await apiClient.get<any>(`/api/problems/projects/${projectId}/impact`);
    return Array.isArray(res.data) ? res.data : (res.data?.impact_metrics || []);
  },

  async getImpactSummary(projectId: number): Promise<{
    project_id: number;
    project_title: string;
    metrics_count: number;
    total_people_impacted: number;
    total_areas_covered: number;
    metrics: Impact[];
  }> {
    const res = await apiClient.get(`/api/problems/projects/${projectId}/impact/summary`);
    return res.data;
  },
};
