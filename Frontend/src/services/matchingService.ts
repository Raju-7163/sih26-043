import { apiClient } from './apiClient';
import { UniversityMatch, IndustryMatch, Partnership } from '../types';

export const matchingService = {
  // ── University Matches ────────────────────────────────────────────────────

  async getUniversityMatches(problemId: number): Promise<UniversityMatch[]> {
    const res = await apiClient.get(`/api/problems/${problemId}/universities`);
    // Backend returns: { problem: {...}, total_matches: N, universities: [...] }
    const data = res.data;
    return (data?.universities ?? data?.matches ?? (Array.isArray(data) ? data : [])) as UniversityMatch[];
  },

  async generateUniversityMatches(problemId: number): Promise<{ message: string; matches: UniversityMatch[] }> {
    const res = await apiClient.post(`/api/problems/${problemId}/universities/generate`);
    // Backend returns: { message, problem_id, total_matches, matches: [...] }
    const data = res.data;
    const matches = (data?.matches ?? []) as UniversityMatch[];
    return { message: data?.message ?? '', matches };
  },

  async acceptUniversityMatch(matchId: number): Promise<{ message: string; match: UniversityMatch }> {
    // matchId MUST be a number — the backend path param is typed as int
    const id = Number(matchId);
    if (!id || isNaN(id)) throw new Error('Invalid match ID');
    const res = await apiClient.put(`/api/problems/matches/${id}/accept`);
    return res.data;
  },

  async rejectUniversityMatch(matchId: number): Promise<{ message: string; match: UniversityMatch }> {
    const id = Number(matchId);
    if (!id || isNaN(id)) throw new Error('Invalid match ID');
    const res = await apiClient.put(`/api/problems/matches/${id}/reject`);
    return res.data;
  },

  // ── Industry Matches ──────────────────────────────────────────────────────

  async getIndustryMatches(problemId: number): Promise<IndustryMatch[]> {
    const res = await apiClient.get(`/api/problems/${problemId}/industries`);
    // Backend returns: { problem_id, problem_title, industry_matches: [...], matches: [...] }
    const data = res.data;
    return (data?.industry_matches ?? data?.matches ?? (Array.isArray(data) ? data : [])) as IndustryMatch[];
  },

  async generateIndustryMatches(problemId: number): Promise<{ message: string; matches: IndustryMatch[] }> {
    const res = await apiClient.post(`/api/problems/${problemId}/industries/generate`);
    // Backend returns: { message, problem_id, matches: [...] }
    const data = res.data;
    // Enrich generated matches with names from the response if present
    const matches = (data?.matches ?? []) as IndustryMatch[];
    return { message: data?.message ?? '', matches };
  },

  async acceptIndustryMatch(matchId: number): Promise<{ message: string }> {
    const id = Number(matchId);
    if (!id || isNaN(id)) throw new Error('Invalid match ID');
    const res = await apiClient.put(`/api/problems/industries/${id}/accept`);
    return res.data;
  },

  async rejectIndustryMatch(matchId: number): Promise<{ message: string }> {
    const id = Number(matchId);
    if (!id || isNaN(id)) throw new Error('Invalid match ID');
    const res = await apiClient.put(`/api/problems/industries/${id}/reject`);
    return res.data;
  },

  // ── Partnerships ──────────────────────────────────────────────────────────

  async createPartnership(
    problemId: number,
    universityId?: number,
    industryId?: number
  ): Promise<{ message: string; partnership: Partnership }> {
    const res = await apiClient.post(`/api/problems/${problemId}/partnerships`, null, {
      params: { university_id: universityId, industry_id: industryId },
    });
    return res.data;
  },

  async getPartnerships(problemId: number): Promise<Partnership[]> {
    const res = await apiClient.get(`/api/problems/${problemId}/partnerships`);
    const data = res.data;
    return (Array.isArray(data) ? data : data?.partnerships ?? []) as Partnership[];
  },

  async confirmPartnership(partnershipId: number): Promise<{ message: string; partnership: Partnership }> {
    const id = Number(partnershipId);
    if (!id || isNaN(id)) throw new Error('Invalid partnership ID');
    const res = await apiClient.put(`/api/problems/partnerships/${id}/accept`);
    return res.data;
  },

  async getPartnershipDetails(partnershipId: number): Promise<Partnership> {
    const res = await apiClient.get(`/api/problems/partnerships/${partnershipId}`);
    return res.data;
  },
};
