import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { problemService } from '../../services/problemService';
import { matchingService } from '../../services/matchingService';
import { projectService } from '../../services/projectService';
import { Problem, AIAnalysis, UniversityMatch, IndustryMatch, Partnership } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';
import {
  BrainCircuit,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FolderGit2,
  ArrowRight,
  Upload,
  Check,
  X,
  FileText,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

import { ProblemStatusTimeline } from '../../components/common/ProblemStatusTimeline';

export const ProblemDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const problemId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [uniMatches, setUniMatches] = useState<UniversityMatch[]>([]);
  const [indMatches, setIndMatches] = useState<IndustryMatch[]>([]);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingUni, setIsGeneratingUni] = useState(false);
  const [isGeneratingInd, setIsGeneratingInd] = useState(false);
  const [isConfirmingCollab, setIsConfirmingCollab] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'matching' | 'partnership'>('overview');

  const loadProblemData = async () => {
    if (!problemId || isNaN(problemId)) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const pData = await problemService.getProblem(problemId);
      setProblem(pData);

      // Load AI Analysis
      try {
        const aData = await problemService.getProblemAnalysis(problemId);
        setAnalysis(aData);
      } catch {
        // AI analysis endpoint error or unanalyzed
      }

      // Load Matches & Partnerships
      try {
        const [uRes, iRes, partRes] = await Promise.all([
          matchingService.getUniversityMatches(problemId).catch(() => []),
          matchingService.getIndustryMatches(problemId).catch(() => []),
          matchingService.getPartnerships(problemId).catch(() => []),
        ]);
        setUniMatches(Array.isArray(uRes) ? uRes : []);
        setIndMatches(Array.isArray(iRes) ? iRes : []);
        setPartnerships(Array.isArray(partRes) ? partRes : []);
      } catch {
        setUniMatches([]);
        setIndMatches([]);
        setPartnerships([]);
      }
    } catch {
      toast.error('Failed to load problem details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProblemData();
  }, [problemId]);

  const handleValidate = async () => {
    try {
      await problemService.validateProblem(problemId);
      toast.success('Problem validated successfully!');
      loadProblemData();
    } catch (err: any) {
      toast.error(err.message || 'Validation failed');
    }
  };

  const handleReject = async () => {
    try {
      await problemService.rejectProblem(problemId);
      toast.success('Problem rejected.');
      loadProblemData();
    } catch (err: any) {
      toast.error(err.message || 'Rejection failed');
    }
  };

  const handleConfirmCollaborationDirect = async () => {
    setIsConfirmingCollab(true);
    try {
      const res = await problemService.confirmCollaboration(problemId);
      toast.success('Collaboration officially confirmed by Government!');
      if (res?.project_id) {
        navigate(`/projects/${res.project_id}`);
      } else {
        loadProblemData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Collaboration confirmation failed');
    } finally {
      setIsConfirmingCollab(false);
    }
  };

  const handleGenerateUniMatches = async () => {
    setIsGeneratingUni(true);
    try {
      const res = await matchingService.generateUniversityMatches(problemId);
      toast.success('University smart matches generated with Gemini AI!');
      setUniMatches(res.matches);
    } catch (err: any) {
      toast.error(err.message || 'University matching failed');
    } finally {
      setIsGeneratingUni(false);
    }
  };

  const handleGenerateIndMatches = async () => {
    setIsGeneratingInd(true);
    try {
      const res = await matchingService.generateIndustryMatches(problemId);
      toast.success('Industry capability matches generated!');
      setIndMatches(res.matches);
    } catch (err: any) {
      toast.error(err.message || 'Industry matching failed');
    } finally {
      setIsGeneratingInd(false);
    }
  };

  const handleAcceptUniMatch = async (matchId: number) => {
    // Ensure we have a valid integer match ID
    const id = Number(matchId);
    if (!id || isNaN(id)) {
      toast.error('Invalid match ID — try regenerating the matches.');
      return;
    }
    try {
      await matchingService.acceptUniversityMatch(id);
      toast.success('University match accepted!');
      loadProblemData();
    } catch (err: any) {
      toast.error(err.message || 'Acceptance failed');
    }
  };

  const handleAcceptIndMatch = async (matchId: number) => {
    const id = Number(matchId);
    if (!id || isNaN(id)) {
      toast.error('Invalid match ID — try regenerating the matches.');
      return;
    }
    try {
      await matchingService.acceptIndustryMatch(id);
      toast.success('Industry match accepted!');
      loadProblemData();
    } catch (err: any) {
      toast.error(err.message || 'Acceptance failed');
    }
  };

  const handleCreatePartnership = async () => {
    const acceptedUni = uniMatches.find((m) => m.status === 'Accepted');
    const acceptedInd = indMatches.find((m) => m.status === 'Accepted');

    if (!acceptedUni && !acceptedInd) {
      toast.error('At least one accepted partner (University or Industry) is required.');
      return;
    }

    try {
      await matchingService.createPartnership(problemId, acceptedUni?.university_id, acceptedInd?.industry_id);
      toast.success('4-Party Collaboration Record created!');
      loadProblemData();
    } catch (err: any) {
      toast.error(err.message || 'Partnership creation failed');
    }
  };

  const handleConfirmPartnership = async (partnershipId: number) => {
    setIsConfirmingCollab(true);
    try {
      await matchingService.confirmPartnership(partnershipId);
      toast.success('Government final confirmation granted! Creating project...');
      const proj = await projectService.createProject(problemId);
      toast.success('Project workspace created!');
      navigate(`/projects/${proj.project.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Confirmation failed');
    } finally {
      setIsConfirmingCollab(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton count={1} type="detail" />;
  }

  if (!problem) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Problem Not Found</h2>
        <Link to="/" className="text-indigo-600 underline text-sm mt-2 block">
          Return to Home
        </Link>
      </div>
    );
  }

  const isGovt = user?.role === 'government';
  const isUni = user?.role === 'university';
  const isInd = user?.role === 'industry';

  const acceptedUniMatch = uniMatches.find((m) => m.status === 'Accepted');
  const acceptedIndMatch = indMatches.find((m) => m.status === 'Accepted');
  const isCollabReady = (acceptedUniMatch || uniMatches.length > 0) && (acceptedIndMatch || indMatches.length > 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Universal Status Timeline */}
      <ProblemStatusTimeline
        status={problem.status}
        validationStatus={problem.validation_status}
        universityStatus={acceptedUniMatch ? 'Accepted' : 'Pending'}
        industryStatus={acceptedIndMatch ? 'Accepted' : 'Pending'}
        collaborationStatus={problem.status === 'Collaboration Confirmed' ? 'Confirmed' : 'Pending'}
      />

      {/* COLLABORATION READY BANNER FOR GOVERNMENT */}
      {isCollabReady && problem.status !== 'Collaboration Confirmed' && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>COLLABORATION READY</span>
            </div>
            <h2 className="text-xl font-black">Both Quad-Helix Partners Accepted</h2>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-emerald-100">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>University: {acceptedUniMatch?.university_name || 'Demo University'} (✓ Accepted)</span>
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Industry: {acceptedIndMatch?.industry_name || 'Demo Industry'} (✓ Accepted)</span>
              </span>
            </div>
          </div>

          {isGovt ? (
            <button
              onClick={handleConfirmCollaborationDirect}
              disabled={isConfirmingCollab}
              className="px-6 py-3.5 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-black shadow-lg transition flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>CONFIRM COLLABORATION</span>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold">
              Awaiting Government Final Confirmation
            </div>
          )}
        </div>
      )}

      {/* Top Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
              {problem.category || 'General'}
            </span>
            {problem.department && (
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                Department: {problem.department}
              </span>
            )}
          </div>
          <StatusBadge status={problem.status} size="lg" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 dark:text-white leading-tight">
          {problem.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
          {problem.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              <span>{problem.location}</span>
            </span>
          )}
          {problem.urgency && (
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Urgency: {problem.urgency}</span>
            </span>
          )}
          {problem.created_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Reported: {new Date(problem.created_at).toLocaleDateString()}</span>
            </span>
          )}
        </div>

        {/* Government Action Bar */}
        {isGovt && problem.status === 'Submitted' && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <button
              onClick={handleValidate}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Validate Problem</span>
            </button>
            <button
              onClick={handleReject}
              className="px-5 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 rounded-xl border border-rose-200 transition flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Reject Problem</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-bold font-heading">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Overview & Attachments
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'ai'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>AI Analysis Insights</span>
        </button>
        <button
          onClick={() => setActiveTab('matching')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'matching'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Smart Matching ({uniMatches.length + indMatches.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('partnership')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'partnership'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Collaboration Matrix</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Problem Description
            </h3>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {problem.description}
            </p>
          </div>

          {(problem.image_url || problem.video_url || problem.docs_url) && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Uploaded Evidence Links
              </h4>
              <div className="flex flex-wrap gap-3 text-xs">
                {problem.image_url && (
                  <a
                    href={problem.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-100 hover:underline"
                  >
                    🖼️ View Image Evidence
                  </a>
                )}
                {problem.video_url && (
                  <a
                    href={problem.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold border border-purple-100 hover:underline"
                  >
                    🎥 View Video Evidence
                  </a>
                )}
                {problem.docs_url && (
                  <a
                    href={problem.docs_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold border border-blue-100 hover:underline"
                  >
                    📄 View Document File
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60">
            <BrainCircuit className="w-8 h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <h3 className="text-base font-bold font-heading text-indigo-900 dark:text-indigo-100">
                Gemini AI Problem Understanding
              </h3>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                AI extracts structured requirements from unstructured citizen reports. Human government officers retain full validation control.
              </p>
            </div>
          </div>

          {analysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Suggested Category:</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{analysis.category || 'N/A'}</div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Responsible Department:</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{analysis.department || 'N/A'}</div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Urgency Assessment:</span>
                  <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {analysis.urgency} (Score: {analysis.urgency_score ?? 75}/100)
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Required Expertise:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {analysis.required_expertise?.map((exp, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      >
                        {exp}
                      </span>
                    )) || <span className="text-xs text-slate-400">None extracted</span>}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Suggested Solution Areas:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {analysis.suggested_solution_areas?.map((sol, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100"
                      >
                        {sol}
                      </span>
                    )) || <span className="text-xs text-slate-400">Standard engineering solution</span>}
                  </div>
                </div>

                {analysis.duplicate_candidates && analysis.duplicate_candidates.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs space-y-1">
                    <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5" />
                      <span>TF-IDF Duplicate Detection Candidate</span>
                    </div>
                    {analysis.duplicate_candidates.map((dup) => (
                      <div key={dup.id} className="text-amber-900 dark:text-amber-200">
                        #{dup.id} {dup.title} ({(dup.similarity_score * 100).toFixed(0)}% similarity)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic">No AI analysis cached for this problem yet.</div>
          )}
        </div>
      )}

      {activeTab === 'matching' && (
        <div className="space-y-6">
          {/* Universities Section */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                  University / HEI Research Matches
                </h3>
              </div>

              {(isGovt || isUni) && (
                <button
                  onClick={handleGenerateUniMatches}
                  disabled={isGeneratingUni}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingUni ? 'Matching...' : 'Generate University Matches'}</span>
                </button>
              )}
            </div>

            {uniMatches.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">
                No university matches generated yet. Click "Generate University Matches".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uniMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {match.university_name || `University #${match.university_id}`}
                      </div>
                      <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60">
                        {match.match_score}% Match
                      </span>
                    </div>

                    {match.matched_expertise && (
                      <div className="text-xs space-y-1">
                        <span className="font-semibold text-slate-500">Matched Expertise:</span>
                        <div className="flex flex-wrap gap-1">
                          {match.matched_expertise.map((exp, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              ✓ {exp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                      <StatusBadge status={match.status} size="sm" />
                      {(isUni || isGovt) && match.status === 'Pending' && (
                        <button
                          onClick={() => handleAcceptUniMatch(match.match_id ?? match.id)}
                          className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
                        >
                          Accept Request
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Industry Section */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                  Industry / MSME / CSR Capability Matches
                </h3>
              </div>

              {(isGovt || isInd) && (
                <button
                  onClick={handleGenerateIndMatches}
                  disabled={isGeneratingInd}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingInd ? 'Matching...' : 'Generate Industry Matches'}</span>
                </button>
              )}
            </div>

            {indMatches.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">
                No industry matches generated yet. Click "Generate Industry Matches".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {indMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {match.industry_name || `Industry #${match.industry_id}`}
                      </div>
                      <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60">
                        {match.match_score}% Match
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                      <StatusBadge status={match.status} size="sm" />
                      {(isInd || isGovt) && match.status === 'Pending' && (
                        <button
                          onClick={() => handleAcceptIndMatch(match.match_id ?? match.id)}
                          className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
                        >
                          Accept Request
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'partnership' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
              Quad-Helix 4-Party Collaboration Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Citizen (Reported) → Government (Validated) → University (Accepted) → Industry (Accepted) → Government Final Confirmation → Project Active
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-500">1. Citizen</div>
              <div className="text-sm font-extrabold text-emerald-600 mt-1">✓ Reported</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-500">2. Government</div>
              <div className="text-sm font-extrabold text-emerald-600 mt-1">
                {problem.status !== 'Submitted' ? '✓ Validated' : '⏳ Pending'}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-500">3. University</div>
              <div className="text-sm font-extrabold text-emerald-600 mt-1">
                {uniMatches.some((m) => m.status === 'Accepted') ? '✓ Accepted' : '⏳ Pending'}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-500">4. Industry</div>
              <div className="text-sm font-extrabold text-emerald-600 mt-1">
                {indMatches.some((m) => m.status === 'Accepted') ? '✓ Accepted' : '⏳ Pending'}
              </div>
            </div>
          </div>

          {/* Action Trigger for Government Confirmation */}
          {isGovt && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4">
              {partnerships.length === 0 ? (
                <button
                  onClick={handleCreatePartnership}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
                >
                  Create Collaboration Record
                </button>
              ) : (
                partnerships.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    {!p.government_confirmed ? (
                      <button
                        onClick={() => handleConfirmPartnership(p.id)}
                        disabled={isConfirmingCollab}
                        className="px-6 py-3 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Official Collaboration & Launch Project</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Government Final Confirmation Granted</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
