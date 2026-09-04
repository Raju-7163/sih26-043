import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { problemService } from '../../services/problemService';
import { matchingService } from '../../services/matchingService';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Sparkles,
  Send,
  FolderGit2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  FlaskConical,
  Award,
  BookOpen,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export const UniversityDashboard: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchInbox = () => {
    setIsLoading(true);
    problemService
      .getUniversityInbox()
      .then((data: any) => {
        const problemList = data?.problems || (Array.isArray(data) ? data : []);
        setRequests(problemList);
      })
      .catch(() => {
        toast.error('Failed to load collaboration requests');
        setRequests([]);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleAccept = async (matchId: number) => {
    if (!matchId) return;
    setProcessingId(matchId);
    try {
      await matchingService.acceptUniversityMatch(matchId);
      toast.success('Collaboration request ACCEPTED! Government notified.');
      fetchInbox();
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept collaboration request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (matchId: number) => {
    if (!matchId) return;
    setProcessingId(matchId);
    try {
      await matchingService.rejectUniversityMatch(matchId);
      toast.info('Collaboration request rejected.');
      fetchInbox();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject collaboration request.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.match_status === 'Pending' || r.status === 'Pending');
  const acceptedRequests = requests.filter((r) => r.match_status === 'Accepted' || r.status === 'Accepted' || r.status === 'University Assigned');

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-100 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Academic & Research Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {user?.organization_name || 'Demo University Portal'}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl">
            Review government-validated collaboration requests matching your institutional expertise. Choose to ACCEPT or REJECT requests to launch joint Quad-Helix research projects.
          </p>
        </div>

        <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-xs font-semibold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-300" />
          <span>Demo HEI Institution</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="New Requests" value={pendingRequests.length} icon={Sparkles} color="blue" />
        <StatCard title="Accepted Requests" value={acceptedRequests.length} icon={CheckCircle2} color="emerald" />
        <StatCard title="Total Opportunities" value={requests.length} icon={Send} color="indigo" />
        <StatCard title="Active Projects" value={acceptedRequests.length} icon={FolderGit2} color="purple" />
      </div>

      {/* NEW COLLABORATION REQUESTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>New Collaboration Requests</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Validated community problems requiring your faculty's research & engineering expertise.
            </p>
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={3} type="card" />
        ) : requests.length === 0 ? (
          <EmptyState
            title="You're all caught up"
            description="When government-validated problems match your institution's expertise, requests will appear here."
            icon={BookOpen}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((item) => {
              const problemId = item.problem_id || item.id;
              const matchId = item.match_id || item.id;
              const isAccepted = item.match_status === 'Accepted' || item.status === 'Accepted' || item.status === 'University Assigned';
              const matchScore = item.match_score || 92;

              return (
                <div
                  key={problemId}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  {/* Top Match Score Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Match Score: {matchScore}%</span>
                    </span>
                    <StatusBadge status={isAccepted ? 'Accepted' : 'Pending'} size="sm" />
                  </div>

                  {/* Body */}
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Expertise Tags */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Required Expertise Match</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(item.required_expertise || ['Hydrology', 'Civil Engineering', 'IoT']).map((exp: string, idx: number) => (
                        <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions: View Request, Accept, Reject */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Link
                      to={`/problems/${problemId}`}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Request</span>
                    </Link>

                    {!isAccepted ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAccept(matchId)}
                          disabled={processingId === matchId}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ACCEPT</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReject(matchId)}
                          disabled={processingId === matchId}
                          className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800 transition flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>REJECT</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>ACCEPTED</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
