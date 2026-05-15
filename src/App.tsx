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
import { motion, AnimatePresence } from 'motion/react';

const MainApp: React.FC = () => {
  const { state, setView } = useProject();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (!state.name) {
    return <SetupView />;
  }

  const renderView = () => {
    switch (state.view) {
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
      default: return <TaskView />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)] transition-colors duration-500">
      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex flex-col flex-1 min-w-0">
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
