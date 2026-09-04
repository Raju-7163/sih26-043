import { apiClient } from './apiClient';
import { Problem, AIAnalysis, Evidence } from '../types';

export interface SubmitProblemPayload {
  title: string;
  description: string;
  category?: string;
  location?: string;
  language?: string;
  urgency?: string;
  input_type?: string;
  image_url?: string;
  video_url?: string;
  voice_url?: string;
  docs_url?: string;
}

export const problemService = {
  async submitProblem(payload: SubmitProblemPayload): Promise<{ message: string; problem: Problem }> {
    const res = await apiClient.post<{ message: string; problem: Problem }>('/api/problems/', payload);
    return res.data;
  },

  async getProblems(params?: { category?: string; status?: string }): Promise<Problem[]> {
    const res = await apiClient.get<Problem[]>('/api/problems/', { params });
    return res.data;
  },

  async getMyProblems(): Promise<Problem[]> {
    const res = await apiClient.get<any>('/api/problems/my');
    return res.data?.problems || (Array.isArray(res.data) ? res.data : []);
  },

  async getPendingProblems(): Promise<Problem[]> {
    const res = await apiClient.get<any>('/api/problems/pending');
    return res.data?.problems || (Array.isArray(res.data) ? res.data : []);
  },

  async getPublicStats(): Promise<{
    total_problems: number;
    validated_problems: number;
    active_projects: number;
    resolved_problems: number;
    universities_count: number;
    industries_count: number;
  }> {
    const res = await apiClient.get('/api/problems/stats/public');
    return res.data;
  },

  async getGovernmentDashboardStats(): Promise<{
    total_problems: number;
    pending_validation: number;
    validated: number;
    rejected: number;
    collaboration_ready: number;
    active_projects: number;
    completed_projects: number;
    recent_problems: Problem[];
  }> {
    const res = await apiClient.get('/api/problems/dashboard/government');
    return res.data;
  },

  async getUniversityDashboard(universityId: number): Promise<any> {
    const res = await apiClient.get(`/api/problems/dashboard/university/${universityId}`);
    return res.data;
  },

  async getIndustryDashboard(industryId: number): Promise<any> {
    const res = await apiClient.get(`/api/problems/dashboard/industry/${industryId}`);
    return res.data;
  },

  async getUniversityInbox(): Promise<Problem[]> {
    const res = await apiClient.get<any>('/api/problems/inbox/university');
    return res.data?.problems || (Array.isArray(res.data) ? res.data : []);
  },

  async getIndustryInbox(): Promise<Problem[]> {
    const res = await apiClient.get<any>('/api/problems/inbox/industry');
    return res.data?.problems || (Array.isArray(res.data) ? res.data : []);
  },

  async getProblem(problemId: number): Promise<Problem> {
    const res = await apiClient.get<Problem>(`/api/problems/${problemId}`);
    return res.data;
  },

  async getProblemAnalysis(problemId: number): Promise<AIAnalysis> {
    const res = await apiClient.get<AIAnalysis>(`/api/problems/${problemId}/analysis`);
    return res.data;
  },

  async validateProblem(problemId: number): Promise<{ message: string; problem: Problem }> {
    const res = await apiClient.put<{ message: string; problem: Problem }>(`/api/problems/${problemId}/validate`);
    return res.data;
  },

  async rejectProblem(problemId: number): Promise<{ message: string; problem: Problem }> {
    const res = await apiClient.put<{ message: string; problem: Problem }>(`/api/problems/${problemId}/reject`);
    return res.data;
  },

  async confirmCollaboration(problemId: number): Promise<{ message: string; problem_id: number; project_id: number; status: string }> {
    const res = await apiClient.put(`/api/problems/${problemId}/confirm-collaboration`);
    return res.data;
  },

  async uploadEvidence(formData: FormData): Promise<{ message: string; evidence: Evidence }> {
    const res = await apiClient.post('/api/problems/evidence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
