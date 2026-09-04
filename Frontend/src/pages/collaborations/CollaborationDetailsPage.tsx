import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { problemService } from '../../services/problemService';
import { matchingService } from '../../services/matchingService';
import { projectService } from '../../services/projectService';
import { Problem, Partnership, ProjectMember } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';
import {
  Users2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  UserPlus,
  ArrowRight,
  FolderGit2,
} from 'lucide-react';
import { toast } from 'sonner';

export const CollaborationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const problemId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!problemId) return;
    setIsLoading(true);
    Promise.all([
      problemService.getProblem(problemId),
      matchingService.getPartnerships(problemId),
    ])
      .then(([pData, partData]) => {
        setProblem(pData);
        setPartnerships(partData);
      })
      .catch(() => toast.error('Failed to load collaboration details'))
      .finally(() => setIsLoading(false));
  }, [problemId]);

  if (isLoading) {
    return <LoadingSkeleton count={1} type="detail" />;
  }

  const isGovt = user?.role === 'government';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
          <Users2 className="w-3.5 h-3.5" />
          <span>Quad-Helix Collaboration Details</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
          {problem?.title || 'Collaboration Workspace'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Status & Team Formation for Problem #{problemId}
        </p>
      </div>

      {/* Partner Acceptances */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6">
        <h2 className="text-base font-bold font-heading text-slate-900 dark:text-white">
          Partner Acceptance Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500">Government</div>
              <div className="text-sm font-extrabold text-emerald-600">✓ Validated</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500">University</div>
              <div className="text-sm font-extrabold text-emerald-600">✓ Accepted</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500">Industry</div>
              <div className="text-sm font-extrabold text-emerald-600">✓ Accepted</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
