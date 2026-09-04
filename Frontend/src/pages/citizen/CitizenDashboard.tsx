import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { problemService } from '../../services/problemService';
import { Problem } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import {
  PlusCircle,
  FileText,
  ShieldCheck,
  FolderGit2,
  CheckCircle2,
  ArrowRight,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    problemService
      .getMyProblems()
      .then((data) => setProblems(Array.isArray(data) ? data : []))
      .catch((err) => {
        toast.error('Failed to load your submitted problems');
        setProblems([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const totalSubmitted = problems.length;
  const pendingCount = problems.filter((p) => p.status === 'Submitted' || p.status === 'Under Review').length;
  const validatedCount = problems.filter((p) => p.status === 'Validated' || p.status === 'Matched' || p.status === 'Collaboration Ready').length;
  const inProjectCount = problems.filter((p) => p.status === 'In Project').length;
  const resolvedCount = problems.filter((p) => p.status === 'Resolved').length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-100 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Citizen Problem Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
            Welcome, {user?.name || 'Citizen'}!
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/90 max-w-xl">
            Report local community problems and track government validation, university research, and industry deployment in real time.
          </p>
        </div>

        <Link
          to="/citizen/submit"
          className="px-5 py-3 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 rounded-2xl shadow-lg transition-all duration-200 flex items-center gap-2 shrink-0 hover:scale-105"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit a Problem</span>
        </Link>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Submitted" value={totalSubmitted} icon={FileText} color="indigo" />
        <StatCard title="Under Review" value={pendingCount} icon={Clock} color="amber" />
        <StatCard title="Validated" value={validatedCount} icon={ShieldCheck} color="emerald" />
        <StatCard title="In Project" value={inProjectCount} icon={FolderGit2} color="blue" />
        <StatCard title="Resolved" value={resolvedCount} icon={CheckCircle2} color="purple" />
      </div>

      {/* Main Problems Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
            My Reported Problems
          </h2>
          <Link
            to="/citizen/submit"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>+ Report New Issue</span>
          </Link>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={3} type="card" />
        ) : problems.length === 0 ? (
          <EmptyState
            title="No Problems Reported Yet"
            description="Be the first to bring a community challenge to light. Voice your concern to trigger AI analysis and government validation."
            actionText="Report a Problem Now"
            actionLink="/citizen/submit"
            icon={PlusCircle}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {problems.map((problem) => (
              <div
                key={problem.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900">
                      {problem.category || 'General'}
                    </span>
                    <StatusBadge status={problem.status} size="sm" />
                  </div>

                  <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {problem.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {problem.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  {problem.location ? (
                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{problem.location}</span>
                    </span>
                  ) : (
                    <span>No location set</span>
                  )}

                  <Link
                    to={`/problems/${problem.id}`}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Track Status</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
