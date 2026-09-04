import { apiClient } from './apiClient';
import { UniversityMatch, IndustryMatch, Partnership } from '../types';

export const matchingService = {
  // University Matches
  async getUniversityMatches(problemId: number): Promise<UniversityMatch[]> {
    const res = await apiClient.get<UniversityMatch[]>(`/api/problems/${problemId}/universities`);
    return res.data;
  },

  async generateUniversityMatches(problemId: number): Promise<{ message: string; matches: UniversityMatch[] }> {
    const res = await apiClient.post(`/api/problems/${problemId}/universities/generate`);
    return res.data;
  },

  async acceptUniversityMatch(matchId: number): Promise<{ message: string; match: UniversityMatch }> {
    const res = await apiClient.put(`/api/problems/matches/${matchId}/accept`);
    return res.data;
  },

  async rejectUniversityMatch(matchId: number): Promise<{ message: string; match: UniversityMatch }> {
    const res = await apiClient.put(`/api/problems/matches/${matchId}/reject`);
    return res.data;
  },

  // Industry Matches
  async getIndustryMatches(problemId: number): Promise<IndustryMatch[]> {
    const res = await apiClient.get<IndustryMatch[]>(`/api/problems/${problemId}/industries`);
    return res.data;
  },

  async generateIndustryMatches(problemId: number): Promise<{ message: string; matches: IndustryMatch[] }> {
    const res = await apiClient.post(`/api/problems/${problemId}/industries/generate`);
    return res.data;
  },

  async acceptIndustryMatch(matchId: number): Promise<{ message: string; match: IndustryMatch }> {
    const res = await apiClient.put(`/api/problems/industries/${matchId}/accept`);
    return res.data;
  },

  async rejectIndustryMatch(matchId: number): Promise<{ message: string; match: IndustryMatch }> {
    const res = await apiClient.put(`/api/problems/industries/${matchId}/reject`);
    return res.data;
  },

  // Partnerships / Collaboration Confirmation
  async createPartnership(problemId: number, universityId?: number, industryId?: number): Promise<{ message: string; partnership: Partnership }> {
    const res = await apiClient.post(`/api/problems/${problemId}/partnerships`, null, {
      params: { university_id: universityId, industry_id: industryId },
    });
    return res.data;
  },

  async getPartnerships(problemId: number): Promise<Partnership[]> {
    const res = await apiClient.get<Partnership[]>(`/api/problems/${problemId}/partnerships`);
    return res.data;
  },

  async confirmPartnership(partnershipId: number): Promise<{ message: string; partnership: Partnership }> {
    const res = await apiClient.put(`/api/problems/partnerships/${partnershipId}/accept`);
    return res.data;
  },

  async getPartnershipDetails(partnershipId: number): Promise<Partnership> {
    const res = await apiClient.get<Partnership>(`/api/problems/partnerships/${partnershipId}`);
    return res.data;
  },
};
