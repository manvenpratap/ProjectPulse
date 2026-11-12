import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { 
  Activity, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Mail, 
  UserCheck, 
  User, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../shared/Button';
import HelpModal from '../shared/HelpModal';
import SectionHelpButton from '../shared/SectionHelpButton';
import { motion } from 'motion/react';

export const LoginView: React.FC = () => {
  const { login, users, switchUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handleOpenHelp = () => setIsHelpOpen(true);
    window.addEventListener('open-view-help', handleOpenHelp);
    return () => window.removeEventListener('open-view-help', handleOpenHelp);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim()) {
      setErrorMessage('Please enter an email address.');
      return;
    }

    const res = login(email, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Login failed.');
    }
  };

  const handleQuickLogin = (userId: string) => {
    switchUser(userId);
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25';
      case 'Project Manager':
        return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25';
      case 'Developer':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
      default:
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25';
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-[var(--color-bg)] relative overflow-hidden select-none">
      {/* Clean architectural hairline grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-divider)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-divider)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="card p-6 sm:p-8 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs rounded-2xl space-y-6 relative">
          <div className="absolute top-4 right-4">
            <SectionHelpButton view="login" section="Persona Roles" label="Sign-in & role guide" />
          </div>
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-primary-hex)] text-white shadow-xs mx-auto mb-1">
              <Activity size={24} strokeWidth={2.4} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              ProjectPulse 2.0
            </h1>
          </div>

          {/* Quick Demo Personas */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--color-text-muted)] px-1">
              <span className="flex items-center gap-1.5">
                <UserCheck size={13} className="text-[var(--color-primary-hex)]" />
                Select Persona Session
              </span>
              <SectionHelpButton view="login" section="Persona Roles" label="Persona roles guide" size={13} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u.id)}
                  className="p-2.5 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-divider)] text-left transition-all active:scale-97 cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[var(--color-text)] truncate">{u.name}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={clsx("text-[10px] font-semibold px-1.5 py-0.5 rounded-md border", getRoleBadgeStyle(u.role))}>
                      {u.role}
                    </span>
                    <ArrowRight size={12} className="text-[var(--color-text-faint)] group-hover:text-[var(--color-text)] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-[var(--color-divider)]" />
            <span className="text-[10px] font-semibold text-[var(--color-text-faint)] uppercase tracking-wider">or sign in</span>
            <div className="flex-1 h-[1px] bg-[var(--color-divider)]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)] block">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@projectpulse.io"
                  className="w-full h-11 pl-9 pr-3.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-medium outline-none focus:border-[var(--color-primary-hex)] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[var(--color-text-muted)] block">Password</label>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-9 pr-3.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-medium outline-none focus:border-[var(--color-primary-hex)] transition-colors"
                />
              </div>
            </div>

            <Button 
              variant="primary" 
              type="submit"
              className="w-full h-11 rounded-xl font-bold bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-sm text-sm active:scale-97"
            >
              Sign In to Workspace
            </Button>
          </form>
        </div>
      </motion.div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} targetView="login" />
    </div>
  );
};

export default LoginView;
