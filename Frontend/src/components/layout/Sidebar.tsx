import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  CheckSquare,
  Sparkles,
  Users2,
  FolderGit2,
  BarChart3,
  Bell,
  User,
  GraduationCap,
  Building2,
  Layers,
  ChevronRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  if (!user) return null;

  const roleNavItems = {
    citizen: [
      { label: 'Overview', path: '/citizen', icon: LayoutDashboard },
      { label: 'Submit Problem', path: '/citizen/submit', icon: PlusCircle },
      { label: 'My Problems', path: '/citizen/problems', icon: FileText },
      { label: 'Notifications', path: '/citizen/notifications', icon: Bell },
      { label: 'Profile', path: '/citizen/profile', icon: User },
    ],
    government: [
      { label: 'Overview', path: '/government', icon: LayoutDashboard },
      { label: 'Incoming Problems', path: '/government/problems', icon: FileText },
      { label: 'Validation Queue', path: '/government/validation', icon: ShieldCheck },
      { label: 'Smart Matching', path: '/government/matching', icon: Sparkles },
      { label: 'Collaborations', path: '/government/collaborations', icon: Users2 },
      { label: 'Active Projects', path: '/government/projects', icon: FolderGit2 },
      { label: 'Impact Dashboard', path: '/government/impact', icon: BarChart3 },
      { label: 'Notifications', path: '/government/notifications', icon: Bell },
      { label: 'Profile', path: '/government/profile', icon: User },
    ],
    university: [
      { label: 'Overview', path: '/university', icon: LayoutDashboard },
      { label: 'Opportunities', path: '/university/opportunities', icon: Sparkles },
      { label: 'New Requests', path: '/university/requests', icon: Send },
      { label: 'Active Projects', path: '/university/projects', icon: FolderGit2 },
      { label: 'Research & Impact', path: '/university/impact', icon: BarChart3 },
      { label: 'Notifications', path: '/university/notifications', icon: Bell },
      { label: 'Profile', path: '/university/profile', icon: User },
    ],
    industry: [
      { label: 'Overview', path: '/industry', icon: LayoutDashboard },
      { label: 'Opportunities', path: '/industry/opportunities', icon: Sparkles },
      { label: 'New Requests', path: '/industry/requests', icon: Send },
      { label: 'Active Projects', path: '/industry/projects', icon: FolderGit2 },
      { label: 'Pilot & Deployment', path: '/industry/deployment', icon: Layers },
      { label: 'Impact Reports', path: '/industry/impact', icon: BarChart3 },
      { label: 'Notifications', path: '/industry/notifications', icon: Bell },
      { label: 'Profile', path: '/industry/profile', icon: User },
    ],
  };

  const navItems = roleNavItems[user.role] || [];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-transform duration-300 ease-in-out flex flex-col justify-between p-4',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="space-y-6">
          {/* Header Role Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold font-heading text-lg shrink-0 shadow-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize truncate">
                {user.organization_name || user.role}
              </div>
            </div>
          </div>

          {/* Navigation Section */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {user.role} Navigation
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === `/${user.role}`}
                    onClick={onClose}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group',
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer info badge */}
        <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-center">
          <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
            Societal Innovation Portal
          </span>
        </div>
      </aside>
    </>
  );
};
