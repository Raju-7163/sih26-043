import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { authService, DemoAccount } from '../../services/authService';
import {
  Sparkles,
  User,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Lock,
  Mail,
  Building,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, isLoggedIn, user } = useAuth();

  const isRegisterMode = searchParams.get('mode') === 'register';
  const nextUrl = searchParams.get('next');

  const [activeRole, setActiveRole] = useState<UserRole>('citizen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);

  // If already logged in, redirect to next URL or role dashboard
  useEffect(() => {
    if (isLoggedIn && user) {
      if (nextUrl) {
        navigate(decodeURIComponent(nextUrl));
      } else {
        navigate(`/${user.role}`);
      }
    }
  }, [isLoggedIn, user, nextUrl, navigate]);

  // Load demo accounts if DEMO_MODE is enabled on backend
  useEffect(() => {
    authService
      .getDemoAccounts()
      .then((data) => {
        if (data.enabled) {
          setDemoAccounts(data.accounts);
        }
      })
      .catch(() => {
        // Fallback demo credentials if endpoint disabled or loading
        setDemoAccounts([
          { name: 'Demo Citizen', email: 'citizen@demo.com', role: 'citizen', password: 'demo123' },
          { name: 'Demo Govt Officer', email: 'govt@demo.com', role: 'government', password: 'demo123' },
          { name: 'Demo University', email: 'uni@demo.com', role: 'university', password: 'demo123' },
          { name: 'Demo Industry', email: 'industry@demo.com', role: 'industry', password: 'demo123' },
        ]);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        await register({
          name,
          email,
          password,
          role: activeRole,
          organization_name: organizationName || undefined,
        });
        toast.success('Account created successfully!');
      } else {
        await login({
          email,
          password,
          role: activeRole,
        });
        toast.success(`Welcome back! Logged in as ${activeRole}.`);
      }

      if (nextUrl) {
        navigate(decodeURIComponent(nextUrl));
      } else {
        navigate(`/${activeRole}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed. Check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (account: DemoAccount) => {
    setIsSubmitting(true);
    setActiveRole(account.role);
    setEmail(account.email);
    setPassword(account.password);

    try {
      await login({
        email: account.email,
        password: account.password,
        role: account.role,
      });
      toast.success(`Demo login successful as ${account.name}!`);
      if (nextUrl) {
        navigate(decodeURIComponent(nextUrl));
      } else {
        navigate(`/${account.role}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    { id: 'citizen', label: 'Citizen', icon: User },
    { id: 'government', label: 'Government', icon: ShieldCheck },
    { id: 'university', label: 'University', icon: GraduationCap },
    { id: 'industry', label: 'Industry', icon: Briefcase },
  ];

  return (
    <div className="max-w-md mx-auto py-8 px-4 sm:px-0">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black font-heading text-slate-900 dark:text-white">
            {isRegisterMode ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {nextUrl ? 'Please log in to access requested page' : 'Select your ecosystem role to proceed'}
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = activeRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveRole(r.id as UserRole)}
                className={clsx(
                  'flex flex-col items-center py-2 px-1 rounded-xl text-[11px] font-semibold transition-all duration-150',
                  isSelected
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder={activeRole === 'citizen' ? 'citizen@demo.com' : `${activeRole}@demo.com`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              />
            </div>
          </div>

          {isRegisterMode && activeRole !== 'citizen' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Organization / Institution Name
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. National Institute of Tech / XYZ Industries"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isRegisterMode ? 'Create Account' : `Log in as ${activeRole}`}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Register / Login mode */}
        <div className="text-center pt-2">
          {isRegisterMode ? (
            <Link
              to={nextUrl ? `/login?next=${encodeURIComponent(nextUrl)}` : '/login'}
              className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
            >
              Already have an account? <span className="font-bold underline">Log In</span>
            </Link>
          ) : (
            <Link
              to={nextUrl ? `/login?mode=register&next=${encodeURIComponent(nextUrl)}` : '/login?mode=register'}
              className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
            >
              Need an account? <span className="font-bold underline">Sign Up</span>
            </Link>
          )}
        </div>

        {/* Quick Demo Login Section */}
        {demoAccounts.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>SIH Presentation Demo Accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc)}
                  disabled={isSubmitting}
                  className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-800/40 text-left transition hover:scale-[1.02]"
                >
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white capitalize">{acc.role}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
