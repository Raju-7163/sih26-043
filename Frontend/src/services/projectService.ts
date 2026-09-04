import { apiClient } from './apiClient';
import { Project, ProjectMember, Proposal, Milestone, ProjectWorkspaceData } from '../types';

export const projectService = {
  // Project creation & workspace
  async createProject(problemId: number): Promise<{ message: string; project: Project }> {
    const res = await apiClient.post(`/api/problems/${problemId}/projects`);
    return res.data;
  },

  async getProjectWorkspace(projectId: number): Promise<ProjectWorkspaceData> {
    const res = await apiClient.get(`/api/problems/projects/${projectId}`);
    return res.data;
  },

  async updateProjectStatus(projectId: number, status: string): Promise<{ message: string; project: Project }> {
    const res = await apiClient.put(`/api/problems/projects/${projectId}/status`, null, {
      params: { status },
    });
    return res.data;
  },

  // Team members
  async addTeamMember(projectId: number, member: { name: string; organization: string; role: string; responsibility?: string }): Promise<{ message: string; member: ProjectMember }> {
    const res = await apiClient.post(`/api/problems/projects/${projectId}/members`, member);
    return res.data;
  },

  async getTeamMembers(projectId: number): Promise<ProjectMember[]> {
    const res = await apiClient.get(`/api/problems/projects/${projectId}/members`);
    return res.data;
  },

  async updateTeamMember(memberId: number, member: { name?: string; organization?: string; role?: string; responsibility?: string }): Promise<{ message: string; member: ProjectMember }> {
    const res = await apiClient.put(`/api/problems/projects/members/${memberId}`, member);
    return res.data;
  },

  async removeTeamMember(memberId: number): Promise<{ message: string }> {
    const res = await apiClient.delete(`/api/problems/projects/members/${memberId}`);
    return res.data;
  },

  // Proposal Workflow
  async getProposal(projectId: number): Promise<Proposal> {
    const res = await apiClient.get<Proposal>(`/api/problems/projects/${projectId}/proposal`);
    return res.data;
  },

  async createProposal(projectId: number, payload: Partial<Proposal>): Promise<{ message: string; proposal: Proposal }> {
    const res = await apiClient.post(`/api/problems/projects/${projectId}/proposal`, null, {
      params: payload,
    });
    return res.data;
  },

  async updateProposal(proposalId: number, payload: Partial<Proposal>): Promise<{ message: string; proposal: Proposal }> {
    const res = await apiClient.put(`/api/problems/projects/proposals/${proposalId}`, null, {
      params: payload,
    });
    return res.data;
  },

  async submitProposal(proposalId: number): Promise<{ message: string; proposal_id: number; status: string }> {
    const res = await apiClient.put(`/api/problems/projects/proposals/${proposalId}/submit`);
    return res.data;
  },

  async reviewProposal(proposalId: number): Promise<{ message: string; proposal_id: number; status: string }> {
    const res = await apiClient.put(`/api/problems/projects/proposals/${proposalId}/review`);
    return res.data;
  },

  async approveProposal(proposalId: number): Promise<{ message: string; proposal_id: number; status: string; project_status: string }> {
    const res = await apiClient.put(`/api/problems/projects/proposals/${proposalId}/approve`);
    return res.data;
  },

  async rejectProposal(proposalId: number, reviewComments?: string): Promise<{ message: string; proposal_id: number; status: string }> {
    const res = await apiClient.put(`/api/problems/projects/proposals/${proposalId}/reject`, null, {
      params: { review_comments: reviewComments },
    });
    return res.data;
  },

  async requestProposalChanges(proposalId: number, reviewComments: string): Promise<{ message: string; proposal_id: number; status: string }> {
    const res = await apiClient.put(`/api/problems/projects/proposals/${proposalId}/request-changes`, null, {
      params: { review_comments: reviewComments },
    });
    return res.data;
  },

  // Milestones & Progress
  async addMilestone(projectId: number, milestone: { title: string; description?: string; milestone_type?: string; due_date?: string; responsible_org?: string }): Promise<{ message: string; milestone: Milestone }> {
    const res = await apiClient.post(`/api/problems/projects/${projectId}/milestones`, milestone);
    return res.data;
  },

  async updateMilestone(milestoneId: number, payload: { status?: string; progress?: number; comments?: string }): Promise<{ message: string; milestone: Milestone }> {
    const res = await apiClient.put(`/api/problems/projects/milestones/${milestoneId}`, null, {
      params: payload,
    });
    return res.data;
  },

  async getProgress(projectId: number): Promise<any> {
    const res = await apiClient.get(`/api/problems/projects/${projectId}/progress`);
    return res.data;
  },

  // Project Chat Discussion
  async postCollaborationMessage(projectId: number, payload: { sender_type: string; sender_name: string; message: string; message_type?: string }): Promise<any> {
    const res = await apiClient.post(`/api/problems/projects/${projectId}/collaboration`, null, {
      params: payload,
    });
    return res.data;
  },

  async getCollaborationMessages(projectId: number): Promise<any> {
    const res = await apiClient.get(`/api/problems/projects/${projectId}/collaboration`);
    return res.data;
  },
};
