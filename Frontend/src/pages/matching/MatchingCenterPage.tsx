import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { problemService } from '../../services/problemService';
import { matchingService } from '../../services/matchingService';
import { Problem, UniversityMatch, IndustryMatch } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Sparkles,
  GraduationCap,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export const MatchingCenterPage: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    problemService
      .getProblems({ status: 'Validated' })
      .then((data) => setProblems(Array.isArray(data) ? data : []))
      .catch(() => {
        toast.error('Failed to load validated problems for matching');
        setProblems([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-Powered Quad-Helix Matchmaking</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
          Smart Partner Matching Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
          Automated Gemini AI & TF-IDF capability matching connects validated community challenges with specialized University research faculties and Industry/CSR partners.
        </p>
      </div>

      {/* Validated Problems Matching Queue */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
          Validated Problems Ready for Partner Matching
        </h2>

        {isLoading ? (
          <LoadingSkeleton count={3} type="card" />
        ) : problems.length === 0 ? (
          <EmptyState
            title="No Validated Problems Awaiting Partner Matching"
            description="Once government officers validate incoming citizen reports, problems will appear here for automated matching."
            icon={Sparkles}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {problems.map((problem) => (
              <div
                key={problem.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60">
                      {problem.category || 'General'}
                    </span>
                    <StatusBadge status={problem.status} size="sm" />
                  </div>

                  <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                    {problem.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {problem.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Department: {problem.department || 'District Admin'}
                  </span>

                  <Link
                    to={`/problems/${problem.id}`}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <span>Match Partners</span>
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
