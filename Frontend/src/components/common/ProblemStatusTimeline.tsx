import React from 'react';
import { CheckCircle2, Clock, Circle, ArrowRight } from 'lucide-react';

export interface TimelineStep {
  id: string;
  label: string;
  sublabel?: string;
  completed: boolean;
  active: boolean;
}

interface ProblemStatusTimelineProps {
  status?: string;
  validationStatus?: string;
  universityStatus?: string;
  industryStatus?: string;
  collaborationStatus?: string;
  projectStatus?: string;
  compact?: boolean;
}

export const ProblemStatusTimeline: React.FC<ProblemStatusTimelineProps> = ({
  status = 'Submitted',
  validationStatus = 'Pending',
  universityStatus = 'Pending',
  industryStatus = 'Pending',
  collaborationStatus = 'Pending',
  projectStatus = 'Planning',
  compact = false,
}) => {
  // Determine overall active index in the master Quad-Helix workflow pipeline
  let currentStageIndex = 0; // 0: Submitted

  if (status === 'Resolved' || projectStatus === 'Resolved') {
    currentStageIndex = 11;
  } else if (projectStatus === 'Impact' || projectStatus === 'Completed') {
    currentStageIndex = 10;
  } else if (projectStatus === 'Deployment') {
    currentStageIndex = 9;
  } else if (projectStatus === 'Pilot') {
    currentStageIndex = 8;
  } else if (projectStatus === 'Testing') {
    currentStageIndex = 7;
  } else if (projectStatus === 'Prototype') {
    currentStageIndex = 6;
  } else if (projectStatus === 'Proposal' || projectStatus === 'Active') {
    currentStageIndex = 5;
  } else if (collaborationStatus === 'Confirmed' || status === 'Collaboration Ready') {
    currentStageIndex = 4;
  } else if (universityStatus === 'Accepted' && industryStatus === 'Accepted') {
    currentStageIndex = 4;
  } else if (universityStatus === 'Accepted' || industryStatus === 'Accepted') {
    currentStageIndex = 3;
  } else if (validationStatus === 'Validated' || status === 'Validated') {
    currentStageIndex = 2;
  } else if (status === 'Under Review') {
    currentStageIndex = 1;
  }

  const steps: TimelineStep[] = [
    { id: 'submitted', label: 'Submitted', sublabel: 'Citizen Problem Logged', completed: currentStageIndex > 0, active: currentStageIndex === 0 },
    { id: 'review', label: 'Govt Review', sublabel: 'Department Screening', completed: currentStageIndex > 1, active: currentStageIndex === 1 },
    { id: 'validated', label: 'Validated', sublabel: 'Approved for Quad-Helix', completed: currentStageIndex > 2, active: currentStageIndex === 2 },
    { id: 'matching', label: 'HEI & Industry', sublabel: universityStatus === 'Accepted' && industryStatus === 'Accepted' ? 'Both Partners Accepted' : 'Match Requests Dispatched', completed: currentStageIndex > 3, active: currentStageIndex === 3 },
    { id: 'collab_ready', label: 'Collaboration', sublabel: 'Govt Confirmation', completed: currentStageIndex > 4, active: currentStageIndex === 4 },
    { id: 'project', label: 'Project & Team', sublabel: 'Joint Workspace Active', completed: currentStageIndex > 5, active: currentStageIndex === 5 },
    { id: 'prototype', label: 'Prototype', sublabel: 'R&D Phase', completed: currentStageIndex > 6, active: currentStageIndex === 6 },
    { id: 'testing', label: 'Testing', sublabel: 'Field Validation', completed: currentStageIndex > 7, active: currentStageIndex === 7 },
    { id: 'pilot', label: 'Pilot', sublabel: 'Initial Deployment', completed: currentStageIndex > 8, active: currentStageIndex === 8 },
    { id: 'deployment', label: 'Scale Up', sublabel: 'State-wide Launch', completed: currentStageIndex > 9, active: currentStageIndex === 9 },
    { id: 'impact', label: 'Impact Verified', sublabel: 'Metrics & Data Recorded', completed: currentStageIndex > 10, active: currentStageIndex === 10 },
    { id: 'resolved', label: 'Resolved', sublabel: 'Societal Problem Solved', completed: currentStageIndex >= 11, active: currentStageIndex === 11 },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto py-2 px-1">
        {steps.slice(0, 6).map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              step.completed
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : step.active
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-400/30 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
            }`}>
              {step.completed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : step.active ? (
                <Clock className="w-3.5 h-3.5 text-white" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
              )}
              <span>{step.label}</span>
            </div>
            {idx < 5 && <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Quad-Helix Status Timeline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time backend progress from Citizen submission to Societal Impact
          </p>
        </div>
        <div className="text-xs font-medium px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          Stage {currentStageIndex + 1} of {steps.length}
        </div>
      </div>

      <div className="relative">
        {/* Horizontal Connector Line */}
        <div className="hidden lg:block absolute top-5 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-3 relative z-10">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`flex flex-col items-center text-center p-3 rounded-xl transition-all ${
                step.active
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700/60 shadow-sm'
                  : 'bg-transparent'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                  step.completed
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-500/10'
                    : step.active
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-lg shadow-blue-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className={`text-xs font-bold line-clamp-1 ${
                step.active
                  ? 'text-blue-600 dark:text-blue-400'
                  : step.completed
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-slate-400 dark:text-slate-500'
              }`}>
                {step.label}
              </span>
              {step.sublabel && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                  {step.sublabel}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
