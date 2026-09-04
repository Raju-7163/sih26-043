import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { impactService } from '../../services/impactService';
import { ProjectWorkspaceData, ProjectMember, Milestone, Proposal, Impact } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';
import {
  FolderGit2,
  Users2,
  FileText,
  CheckCircle2,
  Clock,
  FlaskConical,
  Layers,
  Send,
  BarChart3,
  MessageSquare,
  Plus,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';

export const ProjectWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { user } = useAuth();

  const [data, setData] = useState<ProjectWorkspaceData | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [impacts, setImpacts] = useState<Impact[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'team' | 'proposal' | 'milestones' | 'prototype' | 'pilot' | 'impact' | 'chat'
  >('overview');

  // Form states for adding team member
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberOrg, setNewMemberOrg] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Developer');

  // Form state for adding milestone
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneOrg, setNewMilestoneOrg] = useState('');

  const loadWorkspace = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const workspace = await projectService.getProjectWorkspace(projectId);
      setData(workspace);

      try {
        const prop = await projectService.getProposal(projectId);
        setProposal(prop);
      } catch {
        // Proposal might not exist yet
      }

      try {
        const imp = await impactService.getProjectImpacts(projectId);
        setImpacts(imp);
      } catch {
        // Impacts load
      }

      try {
        const chat = await projectService.getCollaborationMessages(projectId);
        setChatMessages(chat.messages || []);
      } catch {
        // Chat load
      }
    } catch {
      toast.error('Failed to load project workspace');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [projectId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    try {
      await projectService.addTeamMember(projectId, {
        name: newMemberName,
        organization: newMemberOrg || user?.organization_name || 'Partner Org',
        role: newMemberRole,
      });
      toast.success('Team member added!');
      setNewMemberName('');
      setNewMemberOrg('');
      loadWorkspace();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    try {
      await projectService.addMilestone(projectId, {
        title: newMilestoneTitle,
        responsible_org: newMilestoneOrg || user?.organization_name || 'Lead Org',
      });
      toast.success('Milestone added!');
      setNewMilestoneTitle('');
      setNewMilestoneOrg('');
      loadWorkspace();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add milestone');
    }
  };

  const handlePostChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await projectService.postCollaborationMessage(projectId, {
        sender_type: user?.role === 'government' ? 'Government' : user?.role === 'university' ? 'University' : 'Industry',
        sender_name: user?.name || 'Partner User',
        message: newMessage,
      });
      setNewMessage('');
      const chat = await projectService.getCollaborationMessages(projectId);
      setChatMessages(chat.messages || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to post message');
    }
  };

  if (isLoading) {
    return <LoadingSkeleton count={1} type="detail" />;
  }

  if (!data || !data.project) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Project Not Found</h2>
      </div>
    );
  }

  const { project, problem, university, industry, team, milestones } = data;

  const lifecycleStages = [
    'Validated',
    'Partners Selected',
    'Collaboration Confirmed',
    'Team Formed',
    'Proposal',
    'Prototype',
    'Testing',
    'Pilot',
    'Deployment',
    'Impact',
    'Resolved',
  ];

  const currentStageIndex = lifecycleStages.findIndex(
    (s) => s.toLowerCase() === project.status?.toLowerCase()
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Workspace Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Quad-Helix Project Workspace #{project.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
              {project.title}
            </h1>
          </div>
          <StatusBadge status={project.status} size="lg" />
        </div>

        {/* Partners Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Govt:</span>
            <span className="font-bold text-white">District Administration</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400">University:</span>
            <span className="font-bold text-white">{university?.name || 'Assigned University'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">Industry:</span>
            <span className="font-bold text-white">{industry?.name || 'Assigned Industry'}</span>
          </div>
        </div>

        {/* 11-Stage Interactive Timeline Bar */}
        <div className="pt-6 border-t border-slate-800 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Project Lifecycle Stage
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
            {lifecycleStages.map((stage, idx) => {
              const isDone = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex || (currentStageIndex === -1 && idx === 5);

              return (
                <div key={stage} className="flex items-center shrink-0">
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-md'
                        : isDone
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    <span>{stage}</span>
                  </div>
                  {idx < lifecycleStages.length - 1 && (
                    <span className="w-2 h-0.5 bg-slate-800 mx-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-bold font-heading overflow-x-auto">
        {(
          [
            ['overview', 'Overview'],
            ['team', `Team (${team?.length || 0})`],
            ['proposal', 'Proposal'],
            ['milestones', `Milestones (${milestones?.length || 0})`],
            ['prototype', 'Prototype & Testing'],
            ['pilot', 'Pilot & Deployment'],
            ['impact', `Impact (${impacts.length})`],
            ['chat', `Discussion (${chatMessages.length})`],
          ] as const
        ).map(([tabKey, label]) => (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={`pb-3 border-b-2 transition shrink-0 ${
              activeTab === tabKey
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'overview' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Community Problem Context
            </h3>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{problem?.title}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {problem?.description}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
              Multidisciplinary Project Team
            </h3>
          </div>

          {/* Member List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team?.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</div>
                <div className="text-xs text-slate-500">{member.organization}</div>
                <div className="inline-block px-2 py-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 rounded">
                  {member.role}
                </div>
              </div>
            ))}
          </div>

          {/* Add Team Member Form */}
          <form onSubmit={handleAddMember} className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Add Authorized Team Member
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Member Name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <input
                type="text"
                placeholder="Organization"
                value={newMemberOrg}
                onChange={(e) => setNewMemberOrg(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="Project Coordinator">Govt Project Coordinator</option>
                <option value="Research Lead">Faculty Research Lead</option>
                <option value="Prototype Developer">Student Developer</option>
                <option value="Technology Lead">Industry Tech Lead</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition"
            >
              Add Member
            </button>
          </form>
        </div>
      )}

      {activeTab === 'proposal' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
              Project Solution Proposal
            </h3>
            {proposal && <StatusBadge status={proposal.status} />}
          </div>

          {proposal ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-500">Title:</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{proposal.title}</div>
              </div>
              {proposal.proposed_approach && (
                <div>
                  <span className="font-bold text-slate-500">Proposed Technical Approach:</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-1">{proposal.proposed_approach}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-slate-500 mb-3">No proposal created for this project yet.</p>
              <Link
                to={`/projects/${projectId}/proposal`}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs inline-block"
              >
                Create Solution Proposal
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6">
          <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
            Milestone Progress Tracking
          </h3>

          <div className="space-y-3">
            {milestones?.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{m.title}</div>
                  <div className="text-[10px] text-slate-500">Responsible: {m.responsible_org || 'Lead'}</div>
                </div>
                <StatusBadge status={m.status} size="sm" />
              </div>
            ))}
          </div>

          <form onSubmit={handleAddMilestone} className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
            <input
              type="text"
              required
              placeholder="Milestone Title"
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
            >
              Add Milestone
            </button>
          </form>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6">
          <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
            Project Collaboration Discussion
          </h3>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-indigo-600">{msg.sender_name} ({msg.sender_type})</span>
                  <span className="text-slate-400">{new Date(msg.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200">{msg.message}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handlePostChat} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Type update or comment for team..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
