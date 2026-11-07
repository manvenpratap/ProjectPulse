import React from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  BarChart3, 
  ClipboardList, 
  CalendarDays, 
  Users, 
  History, 
  Bug,
  LayoutDashboard,
  Menu,
  ChevronLeft,
  Activity,
  GanttChart,
  Layers,
  Blocks,
  Database,
  ListChecks,
  BookOpen,
  FileText,
  Presentation,
  ShieldAlert, 
  Settings as SettingsIcon,
  Package,
  Flag,
  Smile
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  onNavigate: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle, onNavigate }) => {
  const { state, setView } = useProject();

  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: Presentation },
    { id: 'deliveries', label: 'ALM Deliveries', icon: Package, badge: state.deliveries?.length },
    { id: 'releases', label: 'Release Roadmap', icon: Flag, badge: state.releases?.length },
    { id: 'tasks', label: 'Tasks Matrix', icon: ClipboardList },
    { id: 'timeline', label: 'Project Timeline', icon: GanttChart },
    { id: 'capacity', label: 'Capacity Plan', icon: BarChart3 },
    { id: 'team', label: 'Team Hub', icon: Users },
    { id: 'features', label: 'Functional Matrix', icon: Layers },
    { id: 'log', label: 'Activity Log', icon: History },
    { id: 'dash', label: 'Intelligence', icon: LayoutDashboard },
    { id: 'scheduler', label: 'Intelligent Scheduler', icon: CalendarDays },
    { id: 'risks', label: 'RAID Register', icon: ShieldAlert },
    { id: 'reports', label: 'Pulse Reports', icon: FileText },
    { id: 'retro', label: 'Sprint Retrospective', icon: Smile, badge: state.retros?.length },
    { id: 'defects', label: 'Defect Workshop', icon: Bug },
    { id: 'scaffolder', label: 'Project Architect', icon: Blocks },
    { id: 'fields', label: 'Field Architect', icon: Database },
    { id: 'dropdowns', label: 'Pulse Registry', icon: ListChecks },
    { id: 'steps', label: 'Step Templates', icon: BookOpen },
    { id: 'settings', label: 'Configuration', icon: SettingsIcon },
  ];

  return (
    <div className={clsx(
      "h-full bg-[var(--color-surface)] border-r border-[var(--color-divider)] flex flex-col motion-safe:transition-[transform,width] duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] fixed lg:relative z-30 shadow-xl lg:shadow-none motion-reduce:transition-none",
      isOpen ? "translate-x-0 w-[280px] max-w-[85vw]" : "-translate-x-full lg:translate-x-0 lg:w-[60px]"
    )}>
      <div className="h-[calc(52px+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] flex items-center justify-between px-4 gap-3 border-b border-[var(--color-divider)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-6 h-6 bg-[var(--color-primary-hex)] rounded-md flex items-center justify-center text-white shrink-0">
            <Activity size={14} strokeWidth={2.5} />
          </div>
          {isOpen && <span className="font-display font-bold text-sm truncate">ProjectPulse</span>}
        </div>
        {isOpen && (
          <button 
            onClick={toggle}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 hover:bg-[var(--color-surface-2)] rounded-lg text-[var(--color-text-muted)] min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scroll">
        {navItems.map((item) => {
          const isActive = state.view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-[38px] rounded-lg transition-colors duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] group",
                isActive 
                  ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-semibold" 
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
              )}
              title={!isOpen ? item.label : undefined}
            >
              <item.icon size={18} className={clsx("shrink-0", isActive && "text-[var(--color-primary-hex)]")} />
              {isOpen && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="text-[13px] truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] font-semibold">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}

        {isOpen && (
          <>
            <div className="pt-6 pb-2 px-3">
              <span className="text-xs font-semibold text-[var(--color-text-faint)]">
                Project stats
              </span>
            </div>
            <div className="px-1 space-y-2">
              <div className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-[var(--color-text-faint)]">Tasks</span>
                  <div className="text-[12px] font-mono font-bold leading-tight">{state.tasks.length}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-[var(--color-text-faint)]">Done</span>
                  <div className="text-[12px] font-mono font-bold leading-tight text-emerald-500">
                    {state.tasks.filter(t => t.status === 'Completed').length}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-[var(--color-text-faint)]">ALM</span>
                  <div className="text-[12px] font-mono font-bold leading-tight text-[var(--color-primary-hex)]">
                    {state.deliveries?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t border-[var(--color-divider)]">
        <button 
          onClick={toggle}
          aria-label={isOpen ? "Collapse navigation sidebar" : "Expand navigation sidebar"}
          className="w-full flex items-center justify-center p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
        >
          {isOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
