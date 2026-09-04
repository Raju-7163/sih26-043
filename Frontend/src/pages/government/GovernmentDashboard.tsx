import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { problemService } from '../../services/problemService';
import { Problem } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Users2,
  FolderGit2,
  BarChart3,
  ArrowRight,
  MapPin,
  Check,
  X,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';

export const GovernmentDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    total_problems: 0,
    pending_validation: 0,
    validated: 0,
    rejected: 0,
    collaboration_ready: 0,
    active_projects: 0,
    completed_projects: 0,
    recent_problems: [] as Problem[],
  });

  const [pendingProblems, setPendingProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dashData, pendingData] = await Promise.all([
        problemService.getGovernmentDashboardStats(),
        problemService.getPendingProblems(),
      ]);
      if (dashData && typeof dashData === 'object' && !('detail' in dashData)) {
        setStats({
          ...dashData,
          recent_problems: Array.isArray(dashData.recent_problems) ? dashData.recent_problems : [],
        });
      }
      setPendingProblems(Array.isArray(pendingData) ? pendingData : []);
    } catch {
      toast.error('Failed to load government dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleValidate = async (problemId: number) => {
    setProcessingId(problemId);
    try {
      await problemService.validateProblem(problemId);
      toast.success('Problem validated successfully! Smart partner matching available.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Validation failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (problemId: number) => {
    setProcessingId(problemId);
    try {
      await problemService.rejectProblem(problemId);
      toast.success('Problem rejected.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Rejection failed');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Central Government Coordination Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
            Government Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Validate citizen reported problems, trigger AI matching algorithms for Universities & Industry, and provide final confirmation for project execution.
          </p>
        </div>

        {stats.pending_validation > 0 && (
          <div className="px-5 py-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-2 shrink-0">
            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
            <span>{stats.pending_validation} Pending Validation Requests</span>
          </div>
        )}
      </div>

      {/* Overview Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard title="Total Reported" value={stats.total_problems} icon={ShieldAlert} color="indigo" />
        <StatCard title="Awaiting Validation" value={stats.pending_validation} icon={Clock} color="amber" />
        <StatCard title="Validated" value={stats.validated} icon={CheckCircle2} color="emerald" />
        <StatCard title="Collab Ready" value={stats.collaboration_ready} icon={Sparkles} color="purple" />
        <StatCard title="Active Projects" value={stats.active_projects} icon={FolderGit2} color="blue" />
        <StatCard title="Impacted & Done" value={stats.completed_projects} icon={BarChart3} color="purple" />
      </div>

      {/* Pending Validation Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
              Problems Awaiting Validation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Only validated problems can enter University and Industry matching algorithms.
            </p>
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={2} type="card" />
        ) : pendingProblems.length === 0 ? (
          <EmptyState
            title="No Problems Pending Validation"
            description="All reported citizen challenges have been reviewed and processed."
            icon={CheckCircle2}
          />
        ) : (
          <div className="space-y-4">
            {pendingProblems.map((problem) => (
              <div
                key={problem.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:border-indigo-300 dark:hover:border-indigo-800 transition"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900">
                      {problem.category || 'General'}
                    </span>
                    {problem.department && (
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {problem.department}
                      </span>
                    )}
                    {problem.urgency && (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50">
                        {problem.urgency} Urgency
                      </span>
                    )}
                    <StatusBadge status={problem.status} size="sm" />
                  </div>

                  <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                    {problem.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {problem.description}
                  </p>

                  {problem.location && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{problem.location}</span>
                    </div>
                  )}
                </div>

                {/* Validation Actions */}
                <div className="flex flex-wrap lg:flex-col items-center gap-2.5 w-full lg:w-auto shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleValidate(problem.id)}
                    disabled={processingId === problem.id}
                    className="flex-1 lg:flex-none px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Validate Problem</span>
                  </button>

                  <button
                    onClick={() => handleReject(problem.id)}
                    disabled={processingId === problem.id}
                    className="flex-1 lg:flex-none px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 rounded-xl border border-rose-200 dark:border-rose-900/40 transition flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>

                  <Link
                    to={`/problems/${problem.id}`}
                    className="w-full lg:w-auto text-center px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center justify-center gap-1"
                  >
                    <span>View AI Insights</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Access Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/government/matching"
          className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition group space-y-3"
        >
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 w-fit">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white group-hover:text-indigo-600 transition">
            Smart Matching Engine
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate and inspect AI-driven University & Industry capability match scores.
          </p>
        </Link>

        <Link
          to="/government/collaborations"
          className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition group space-y-3"
        >
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 w-fit">
            <Users2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white group-hover:text-indigo-600 transition">
            Final Confirmation Hub
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review partner acceptances and issue official government project confirmation.
          </p>
        </Link>

        <Link
          to="/government/projects"
          className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition group space-y-3"
        >
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 w-fit">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white group-hover:text-indigo-600 transition">
            Project Lifecycle Workspace
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor proposals, prototypes, testing, field pilots, and deployment milestones.
          </p>
        </Link>
      </div>
    </div>
  );
};
