import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { Proposal } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';
import { FileText, CheckCircle2, XCircle, AlertTriangle, Send, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export const ProposalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [proposedApproach, setProposedApproach] = useState('');
  const [technology, setTechnology] = useState('');
  const [timeline, setTimeline] = useState('');
  const [reviewComments, setReviewComments] = useState('');

  const loadProposal = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const p = await projectService.getProposal(projectId);
      setProposal(p);
      setTitle(p.title);
      setProposedApproach(p.proposed_approach || '');
      setTechnology(p.technology || '');
      setTimeline(p.timeline || '');
    } catch {
      // Proposal does not exist yet
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProposal();
  }, [projectId]);

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (proposal) {
        await projectService.updateProposal(proposal.id, {
          title,
          proposed_approach: proposedApproach,
          technology,
          timeline,
        });
        toast.success('Proposal updated!');
      } else {
        await projectService.createProposal(projectId, {
          title: title || 'Innovation Solution Proposal',
          proposed_approach: proposedApproach,
          technology,
          timeline,
        });
        toast.success('Proposal created!');
      }
      loadProposal();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitToGovt = async () => {
    if (!proposal) return;
    setIsSubmitting(true);
    try {
      await projectService.submitProposal(proposal.id);
      toast.success('Proposal submitted to Government for review!');
      loadProposal();
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!proposal) return;
    setIsSubmitting(true);
    try {
      await projectService.approveProposal(proposal.id);
      toast.success('Proposal Approved! Project status moved to Prototype.');
      navigate(`/projects/${projectId}`);
    } catch (err: any) {
      toast.error(err.message || 'Approval failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!proposal || !reviewComments.trim()) {
      toast.error('Review comments are required to request changes.');
      return;
    }
    setIsSubmitting(true);
    try {
      await projectService.requestProposalChanges(proposal.id, reviewComments);
      toast.success('Changes requested for proposal.');
      loadProposal();
    } catch (err: any) {
      toast.error(err.message || 'Request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSkeleton count={1} type="detail" />;

  const isGovt = user?.role === 'government';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>Solution Proposal</span>
          </div>
          {proposal && <StatusBadge status={proposal.status} size="lg" />}
        </div>
        <h1 className="text-2xl font-black font-heading">
          {proposal ? proposal.title : 'Draft New Solution Proposal'}
        </h1>
      </div>

      {/* Proposal Editor / Viewer */}
      <form onSubmit={handleSaveDraft} className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Proposal Title
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Decentralized Solar Water Purification Deployment"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={proposal?.status === 'Submitted' || proposal?.status === 'Approved'}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Proposed Technical & Research Approach
          </label>
          <textarea
            rows={5}
            placeholder="Detail the technical solution, engineering methods, and research methodology..."
            value={proposedApproach}
            onChange={(e) => setProposedApproach(e.target.value)}
            disabled={proposal?.status === 'Submitted' || proposal?.status === 'Approved'}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium leading-relaxed"
          />
        </div>

        {!isGovt && (!proposal || proposal.status === 'Draft' || proposal.status === 'Changes Requested') && (
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 rounded-xl"
            >
              Save Draft
            </button>
            {proposal && (
              <button
                type="button"
                onClick={handleSubmitToGovt}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Submit Proposal to Government
              </button>
            )}
          </div>
        )}
      </form>

      {/* Government Officer Actions */}
      {isGovt && proposal && proposal.status === 'Submitted' && (
        <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-4">
          <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">
            Government Review & Approval Controls
          </h3>

          <textarea
            rows={3}
            placeholder="Review comments or required change notes..."
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-white dark:bg-slate-900"
          />

          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              <span>Approve Proposal & Move to Prototype</span>
            </button>

            <button
              onClick={handleRequestChanges}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-amber-800 bg-amber-200 hover:bg-amber-300 rounded-xl flex items-center gap-1"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Request Changes</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
