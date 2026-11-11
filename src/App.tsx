import React, { useState, useEffect, useRef } from 'react';
import { ProjectProvider, useProject } from './store/ProjectContext';
import { AuthProvider, useAuth } from './store/AuthContext';
import { getAllNavItems } from './config/navigation';
import { exportProjectExcel } from './services/excelService';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import OfflineBanner from './components/layout/OfflineBanner';
import MobileBottomNav from './components/layout/MobileBottomNav';
import LoginView from './components/auth/LoginView';
import AccessDenied from './components/auth/AccessDenied';
import AccessManagerModal from './components/auth/AccessManagerModal';
import TaskView from './components/tasks/TaskView';
import TimelineView from './components/timeline/TimelineView';
import DashboardView from './components/dashboard/DashboardView';
import TeamView from './components/team/TeamView';
import LogView from './components/log/LogView';
import DefectView from './components/defects/DefectView';
import CapacityView from './components/team/CapacityView';
import SetupView from './components/layout/SetupView';
import ScaffolderView from './components/architect/ScaffolderView';
import FunctionalMatrix from './components/architect/FunctionalMatrix';
import FieldArchitect from './components/architect/FieldArchitect';
import RegistryView from './components/architect/RegistryView';
import StepTemplates from './components/architect/StepTemplates';
import ReportView from './components/reports/ReportView';
import SettingsView from './components/settings/SettingsView';
import OverviewView from './components/dashboard/OverviewView';
import DeliveriesView from './components/deliveries/DeliveriesView';
import ReleaseRoadmap from './components/architect/ReleaseRoadmap';
import RAIDView from './components/risks/RAIDView';
import SprintRetroView from './components/retro/SprintRetroView';
import { motion, AnimatePresence } from 'motion/react';

const GO_CHORD_MAP: Record<string, { view: string; subTab?: string; label: string }> = {
  o: { view: 'overview', label: 'Executive Overview' },
  d: { view: 'dash', label: 'Project Intelligence' },
  r: { view: 'reports', label: 'Pulse Reports' },
  t: { view: 'tasks', label: 'Tasks & Timeline' },
  l: { view: 'timeline', label: 'Project Timeline' },
  f: { view: 'features', label: 'Functional Matrix' },
  c: { view: 'capacity', label: 'Capacity & Schedule' },
  b: { view: 'defects', label: 'Defect Workshop' },
  k: { view: 'risks', label: 'RAID Register' },
  s: { view: 'settings', label: 'Workspace Settings' },
};

const MainApp: React.FC = () => {
  const { state, setView } = useProject();
  const { isAuthenticated, hasViewAccess, canPerform, currentUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isChordArmed, setIsChordArmed] = useState(false);
  const chordTimerRef = useRef<number | null>(null);

  // If current screen is not permitted for the active user role, automatically route to the user's primary accessible screen
  useEffect(() => {
    if (isAuthenticated && !hasViewAccess(state.view)) {
      const allNav = getAllNavItems();
      const firstAllowed = allNav.find(item => hasViewAccess(item.id))?.id;
      if (firstAllowed && firstAllowed !== state.view) {
        setView(firstAllowed, true);
      }
    }
  }, [isAuthenticated, currentUser?.id, state.view, hasViewAccess, setView]);

  // Global keyboard shortcuts: G + [O/D/R/T/L/F/C/B/K/S] & Cmd/Ctrl+E (isolated from inputs and open modals)
  useEffect(() => {
    const clearChord = () => {
      setIsChordArmed(false);
      if (chordTimerRef.current !== null) {
        window.clearTimeout(chordTimerRef.current);
        chordTimerRef.current = null;
      }
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!isAuthenticated || !state.name) return;
      const target = e.target as HTMLElement | null;
      if (
        !target ||
        target.matches('input, textarea, select, [contenteditable="true"]') ||
        target.isContentEditable ||
        target.closest('[role="dialog"], [role="combobox"], [aria-modal="true"]')
      ) {
        return;
      }

      // Cmd/Ctrl + E -> Export Master Excel workbook (when permitted)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'e') {
        if (canPerform('canExportExcel')) {
          e.preventDefault();
          exportProjectExcel(state);
        }
        return;
      }

      // Skip navigation chords when modifier keys are held
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (isChordArmed) {
        const dest = GO_CHORD_MAP[key];
        clearChord();
        if (dest) {
          if (dest.view === 'timeline' && hasViewAccess('tasks')) {
            e.preventDefault();
            setView('tasks', false, 'timeline');
            return;
          }
          if (hasViewAccess(dest.view)) {
            e.preventDefault();
            setView(dest.view, false, dest.subTab);
          }
        }
        return;
      }

      if (key === 'g' && !e.shiftKey) {
        setIsChordArmed(true);
        chordTimerRef.current = window.setTimeout(() => {
          setIsChordArmed(false);
          chordTimerRef.current = null;
        }, 1200);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (chordTimerRef.current !== null) {
        window.clearTimeout(chordTimerRef.current);
      }
    };
  }, [isAuthenticated, state, isChordArmed, hasViewAccess, canPerform, setView]);

  // If not authenticated, prompt login
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Auto-close sidebar on mobile after navigation
  const handleNav = (v: any) => {
    setView(v);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  if (!state.name) {
    return <SetupView />;
  }

  const renderView = () => {
    // Check role-based or custom access for the current view
    if (!hasViewAccess(state.view)) {
      return (
        <AccessDenied 
          viewId={state.view} 
          onOpenAccessManager={() => setIsAccessModalOpen(true)} 
        />
      );
    }

    switch (state.view) {
      case 'overview': return <OverviewView />;
      case 'deliveries': return <DeliveriesView />;
      case 'releases': return <ReleaseRoadmap />;
      case 'tasks': return <TaskView />;
      case 'timeline':
        return hasViewAccess('tasks')
          ? <TaskView initialMode="timeline" />
          : <TimelineView embedded={false} />;
      case 'dash': return <DashboardView />;
      case 'team': return <TeamView />;
      case 'features': return <FunctionalMatrix />;
      case 'log': return <LogView />;
      case 'defects': return <DefectView />;
      case 'capacity': return <CapacityView />;
      case 'scaffolder': return <ScaffolderView />;
      case 'fields': return <FieldArchitect />;
      case 'dropdowns': return <RegistryView />;
      case 'steps': return <StepTemplates />;
      case 'reports': return <ReportView />;
      case 'retro': return <SprintRetroView />;
      case 'risks': return <RAIDView />;
      case 'settings': return <SettingsView />;
      default: return <OverviewView />;
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[var(--color-bg)] transition-colors duration-500 relative">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        onNavigate={handleNav}
      />
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden overscroll-contain"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        <OfflineBanner />
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-hidden relative pb-[calc(56px+env(safe-area-inset-bottom,0px))] lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>

          {/* Subtle G-Chord Navigation HUD */}
          <AnimatePresence>
            {isChordArmed && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.14 }}
                className="fixed bottom-16 lg:bottom-5 right-5 z-50 px-3.5 py-2 rounded-xl bg-[var(--color-surface)]/95 backdrop-blur-xl border border-[var(--color-primary-hex)]/35 shadow-xl text-xs flex items-center gap-2.5 pointer-events-none"
                role="status"
                aria-live="polite"
              >
                <span className="font-mono font-black px-1.5 py-0.5 rounded bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]">
                  G
                </span>
                <span className="text-[var(--color-text-muted)] font-medium">
                  Go to: <strong className="text-[var(--color-text)]">O</strong>verview · <strong className="text-[var(--color-text)]">D</strong>ash · <strong className="text-[var(--color-text)]">R</strong>eports · <strong className="text-[var(--color-text)]">T</strong>asks · Time<strong className="text-[var(--color-text)]">l</strong>ine · <strong className="text-[var(--color-text)]">C</strong>apacity · <strong className="text-[var(--color-text)]">S</strong>ettings
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Mobile Ergonomic Bottom Navigation Bar */}
        <MobileBottomNav 
          currentView={state.view} 
          onNavigate={handleNav} 
          onOpenMore={() => setIsSidebarOpen(true)} 
        />
      </div>

      {/* Access & Permissions Governance Modal */}
      <AccessManagerModal 
        isOpen={isAccessModalOpen} 
        onClose={() => setIsAccessModalOpen(false)} 
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <MainApp />
      </ProjectProvider>
    </AuthProvider>
  );
}
