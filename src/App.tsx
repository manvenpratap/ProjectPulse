import React, { useState, useEffect } from 'react';
import { ProjectProvider, useProject } from './store/ProjectContext';
import { AuthProvider, useAuth } from './store/AuthContext';
import { getAllNavItems } from './config/navigation';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
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
import SchedulerView from './components/scheduler/SchedulerView';
import SprintRetroView from './components/retro/SprintRetroView';
import { motion, AnimatePresence } from 'motion/react';

const MainApp: React.FC = () => {
  const { state, setView } = useProject();
  const { isAuthenticated, hasViewAccess, currentUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  // If current screen is not permitted for the active user role, automatically route to the user's primary accessible screen
  useEffect(() => {
    if (isAuthenticated && !hasViewAccess(state.view)) {
      const allNav = getAllNavItems();
      const firstAllowed = allNav.find(item => hasViewAccess(item.id))?.id;
      if (firstAllowed && firstAllowed !== state.view) {
        setView(firstAllowed);
      }
    }
  }, [isAuthenticated, currentUser?.id, state.view, hasViewAccess, setView]);

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
      case 'timeline': return <TimelineView />;
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
      case 'scheduler': return <SchedulerView />;
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden overscroll-contain"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      <div className="flex flex-col flex-1 min-w-0 h-full relative">
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
