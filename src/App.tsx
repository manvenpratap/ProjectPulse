import React, { useState } from 'react';
import { ProjectProvider, useProject } from './store/ProjectContext';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
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
import RAIDView from './components/risks/RAIDView';
import SchedulerView from './components/scheduler/SchedulerView';
import { motion, AnimatePresence } from 'motion/react';

const MainApp: React.FC = () => {
  const { state, setView } = useProject();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default to closed for mobile-first

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
    switch (state.view) {
      case 'overview': return <OverviewView />;
      case 'deliveries': return <DeliveriesView />;
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
      case 'risks': return <RAIDView />;
      case 'scheduler': return <SchedulerView />;
      case 'settings': return <SettingsView />;
      default: return <OverviewView />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)] transition-colors duration-500 relative">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        onNavigate={handleNav}
      />
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-hidden relative">
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
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ProjectProvider>
      <MainApp />
    </ProjectProvider>
  );
}
