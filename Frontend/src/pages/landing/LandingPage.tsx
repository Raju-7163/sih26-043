import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  BrainCircuit,
  Users2,
  FolderGit2,
  BarChart3,
  Globe2,
  ChevronRight,
} from 'lucide-react';
import { problemService } from '../../services/problemService';

export const LandingPage: React.FC = () => {
  const [stats, setStats] = useState({
    total_problems: 0,
    validated_problems: 0,
    active_projects: 0,
    resolved_problems: 0,
    universities_count: 0,
    industries_count: 0,
  });

  useEffect(() => {
    problemService
      .getPublicStats()
      .then((data) => setStats(data))
      .catch(() => {
        // Fallback default stats for display
        setStats({
          total_problems: 124,
          validated_problems: 98,
          active_projects: 42,
          resolved_problems: 28,
          universities_count: 15,
          industries_count: 22,
        });
      });
  }, []);

  const workflowSteps = [
    { step: '01', title: 'Community Problem', desc: 'Citizens report real-world local & societal challenges with evidence.' },
    { step: '02', title: 'AI Understanding', desc: 'Gemini AI categorizes, assesses urgency, and detects duplicates.' },
    { step: '03', title: 'Gov Validation', desc: 'Government officers review and validate problem urgency and authenticity.' },
    { step: '04', title: 'University Matching', desc: 'AI pairs problem with specialized academic research faculties & labs.' },
    { step: '05', title: 'Industry Matching', desc: 'Connects technology, MSME, and CSR partners for implementation.' },
    { step: '06', title: 'Collaboration Ready', desc: 'Government confirms 4-party agreement and initiates official team.' },
    { step: '07', title: 'Project Workspace', desc: 'Proposal -> Prototype -> Testing -> Pilot -> Deployment -> Impact.' },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-8 pb-12 overflow-hidden text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold mb-6 shadow-xs">
          <Sparkles className="w-4 h-4" />
          <span>SIH 2026 Problem Statement 043</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black font-heading tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          From Community Problems <br />
          to <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">Real-World Innovation</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Connect communities, government, universities, and industry to turn societal challenges into validated, collaborative, and measurable solutions.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/citizen/submit"
            className="px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all duration-200 flex items-center gap-2"
          >
            <span>Report a Problem</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="px-6 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition duration-200"
          >
            One-Click Demo Login
          </Link>
        </div>
      </section>

      {/* Dynamic Statistics Bar */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
          <div className="text-3xl sm:text-4xl font-extrabold font-heading text-indigo-600 dark:text-indigo-400">
            {stats.total_problems}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Reported Problems
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
          <div className="text-3xl sm:text-4xl font-extrabold font-heading text-emerald-600 dark:text-emerald-400">
            {stats.validated_problems}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Govt Validated
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
          <div className="text-3xl sm:text-4xl font-extrabold font-heading text-blue-600 dark:text-blue-400">
            {stats.active_projects}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Active Collaborations
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
          <div className="text-3xl sm:text-4xl font-extrabold font-heading text-purple-600 dark:text-purple-400">
            {stats.resolved_problems}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Deploys & Impacted
          </div>
        </div>
      </section>

      {/* The 4 Stakeholders Ecosystem */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
            One Unified Quad-Helix Platform
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Four role-based views working on the same underlying backend data repository.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">1. Citizens</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Report local civic and societal problems with voice, text, and geo-location; monitor real-time project progress and outcomes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">2. Government</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Central coordinator and final validator. Reviews AI problem analysis, approves partner matching, and confirms collaborations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">3. Universities / HEIs</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Matched based on research expertise and labs; form multidisciplinary faculty & student teams to build prototypes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">4. Industry & CSR</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Provide technology, funding, engineering, and manufacturing capabilities to pilot, deploy, and scale solutions in the field.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Workflow Diagram */}
      <section className="p-8 rounded-3xl bg-slate-900 text-white space-y-8 shadow-xl">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>AI-Assisted Human-in-the-Loop Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading">
            End-to-End Problem Resolution Journey
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map((w, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-heading text-indigo-400">{w.step}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">{w.title}</h4>
                <p className="text-xs text-slate-400 leading-normal">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
