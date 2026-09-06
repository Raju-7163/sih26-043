export type UserRole = 'citizen' | 'government' | 'university' | 'industry';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  organization_name?: string | null;
  org_id?: number | null;
  is_active: boolean;
}

export interface AuthResponse {
  message?: string;
  access_token: string;
  token_type: string;
  user: User;
}

export type ProblemStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Validated'
  | 'Rejected'
  | 'Matched'
  | 'PartnerMatching'
  | 'University Assigned'
  | 'Industry Assigned'
  | 'Collaboration Ready'
  | 'Collaboration Confirmed'
  | 'In Project'
  | 'Resolved'
  | string;

export interface Problem {
  id: number;
  title: string;
  description: string;
  category?: string | null;
  priority?: string | null;
  status: ProblemStatus;
  validation_status?: string | null;
  location?: string | null;
  language?: string | null;
  urgency?: string | null;
  input_type?: string | null;
  citizen_id?: number | null;
  department?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  voice_url?: string | null;
  docs_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AIAnalysis {
  category?: string;
  department?: string;
  urgency?: string;
  urgency_score?: number;
  impact_score?: number;
  priority?: string;
  required_expertise?: string[];
  suggested_solution_areas?: string[];
  summary?: string;
  duplicate_candidates?: Array<{
    id: number;
    title: string;
    similarity_score: number;
  }>;
}

export interface UniversityMatch {
  id: number;
  match_id?: number;        // same as id — DB UniversityMatch PK
  problem_id: number;
  university_id: number;
  university_name?: string;
  location?: string;
  institution_type?: string;
  description?: string;
  match_score: number;
  expertise_score?: number;
  expertise_match?: number;
  category_match?: boolean;
  location_match?: boolean;
  status: 'Pending' | 'Accepted' | 'Rejected';
  matched_expertise?: string[];
  missing_expertise?: string[];
  facilities?: string[];
  research_areas?: string[];
  created_at?: string;
}

export interface IndustryMatch {
  id: number;
  match_id?: number;        // same as id — DB IndustryMatch PK
  problem_id: number;
  industry_id: number;
  industry_name?: string;
  location?: string;
  organization_type?: string;
  description?: string;
  match_score: number;
  expertise_score?: number;
  domain_match?: boolean;
  capability_match?: boolean;
  status: 'Pending' | 'Accepted' | 'Rejected';
  matched_expertise?: string[];
  missing_expertise?: string[];
  matched_capabilities?: string[];
  missing_capabilities?: string[];
  match_reasons?: string[];
  relevant_capabilities?: string[];
  created_at?: string;
}

export interface Partnership {
  id: number;
  problem_id: number;
  university_id?: number | null;
  university_name?: string;
  industry_id?: number | null;
  industry_name?: string;
  government_confirmed: boolean;
  status: 'Forming' | 'Active' | 'Completed';
  created_at?: string;
}

export type ProjectStatus =
  | 'Proposal'
  | 'Prototype'
  | 'Testing'
  | 'Pilot'
  | 'Deployment'
  | 'Impact'
  | 'Resolved';

export interface Project {
  id: number;
  problem_id: number;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
}

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id?: number | null;
  name: string;
  organization: string;
  role: string;
  responsibility?: string | null;
  email?: string;
}

export type ProposalStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Changes Requested';

export interface Proposal {
  id: number;
  project_id: number;
  title: string;
  problem_understanding?: string | null;
  proposed_approach?: string | null;
  technology?: string | null;
  objectives?: string | null;
  expected_outcome?: string | null;
  timeline?: string | null;
  budget?: number | null;
  status: ProposalStatus;
  review_comments?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Milestone {
  id: number;
  project_id: number;
  title: string;
  description?: string | null;
  milestone_type?: string | null;
  status: 'Pending' | 'In Progress' | 'Completed';
  due_date?: string | null;
  responsible_org?: string | null;
  progress?: number;
  comments?: string | null;
  created_at?: string;
}

export interface Impact {
  id: number;
  project_id: number;
  metric_name: string;
  target_value?: number | null;
  current_value?: number | null;
  unit?: string | null;
  people_impacted?: number | null;
  areas_covered?: number | null;
  description?: string | null;
  created_at?: string;
}

export interface Evidence {
  id: number;
  problem_id?: number | null;
  project_id?: number | null;
  milestone_id?: number | null;
  impact_id?: number | null;
  file_name: string;
  file_path: string;
  file_type?: string | null;
  file_size?: number | null;
  description?: string | null;
  uploaded_by?: string | null;
  created_at?: string;
}

export interface AppNotification {
  id: number;
  recipient_type: string;
  recipient_name?: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  problem_id?: number | null;
  project_id?: number | null;
  created_at?: string;
}

export interface ProjectWorkspaceData {
  project: Project;
  problem: Problem;
  university?: { id: number; name: string } | null;
  industry?: { id: number; name: string } | null;
  team: ProjectMember[];
  milestones: Milestone[];
  proposal?: Proposal | null;
  impacts?: Impact[];
  evidences?: Evidence[];
}
