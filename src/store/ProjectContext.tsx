import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  ProjectState, Task, Member, Defect, Delivery, ProjectReport, 
  LogEntry, TaskStatus, TaskPriority, CustomField 
} from '../types';
import { getDefaultState } from './defaultState';
import { nowISO, todayStr, getBusinessDays, addBusDays, getNextBusDay } from '../utils/projectUtils';

import { getWebSample } from '../services/sampleData';
import confetti from 'canvas-confetti';

interface ProjectContextType {
  state: ProjectState;
  createTask: (data: Partial<Task>) => Task;
  updateTask: (taskId: string, data: Partial<Task>, comment?: string) => void;
  deleteTask: (taskId: string) => void;
  saveMember: (data: Partial<Member>, memberId?: string) => void;
  deleteMember: (memberId: string) => void;
  saveDefect: (data: Partial<Defect>, defectId?: string) => void;
  deleteDefect: (defectId: string) => void;
  saveDelivery: (data: Partial<Delivery>, deliveryId?: string) => void;
  deleteDelivery: (deliveryId: string) => void;
  batchUpdateDeliveries: (ids: string[], updates: Partial<Delivery>) => void;
  addLog: (action: string, taskId: string, taskName: string, field?: string, oldVal?: string, newVal?: string, comment?: string) => void;
  setView: (view: string, replace?: boolean) => void;
  setTheme: (theme: string) => void;
  updateSettings: (settings: Partial<ProjectState['settings']>) => void;
  resetProject: (name: string, desc: string, team: string[]) => void;
  loadSample: (type: 'web' | 'mobile') => void;
  updateProject: (data: Partial<ProjectState>) => void;
  clearAllData: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoading: boolean;
}

const VALID_VIEWS = new Set([
  'overview', 'dash', 'reports', 'tasks', 'deliveries',
  'timeline', 'releases', 'team', 'capacity', 'scheduler',
  'defects', 'risks', 'retro', 'log', 'features',
  'scaffolder', 'fields', 'steps', 'dropdowns', 'settings'
]);

export const getViewFromURL = (): string | null => {
  if (typeof window === 'undefined') return null;
  // 1. Check hash first: #/tasks or #tasks
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].trim().toLowerCase();
  if (hash && VALID_VIEWS.has(hash)) {
    return hash === 'scheduler' ? 'capacity' : hash;
  }
  // 2. Check pathname: /tasks
  const path = window.location.pathname.replace(/^\//, '').split('/')[0].trim().toLowerCase();
  if (path && VALID_VIEWS.has(path)) {
    return path === 'scheduler' ? 'capacity' : path;
  }
  return null;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ProjectState>(() => {
    const base = getDefaultState();
    const urlView = getViewFromURL();
    if (urlView) {
      base.view = urlView;
    }
    return base;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadSample = useCallback((type: 'web' | 'mobile') => {
    const sample = getWebSample();
    setState(prev => ({
      ...getDefaultState(),
      ...sample as any
    }));
  }, []);


  // Load from localStorage & sync URL
  useEffect(() => {
    const savedData = localStorage.getItem('pp-data');
    const savedColorMode = localStorage.getItem('pp-color-mode');
    if (savedColorMode) {
      document.documentElement.setAttribute('data-color-mode', savedColorMode);
    }

    const urlView = getViewFromURL();

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const defaultState = getDefaultState();
        const sample = getWebSample();
        const finalTheme = parsed.theme || 'pulse';
        document.documentElement.setAttribute('data-theme', finalTheme);

        const activeView = urlView || parsed.view || defaultState.view || 'overview';
        if (typeof window !== 'undefined') {
          window.history.replaceState({ view: activeView }, '', '#/' + activeView);
        }

        setState({ 
          ...defaultState, 
          ...parsed,
          view: activeView,
          name: parsed.name || sample.name || 'Project Phoenix: Enterprise Rollout',
          tasks: (parsed.tasks && parsed.tasks.length > 0) ? parsed.tasks : (sample.tasks || []),
          members: (parsed.members && parsed.members.length > 0) ? parsed.members : (sample.members || []),
          deliveries: (parsed.deliveries && parsed.deliveries.length > 0) ? parsed.deliveries : (sample.deliveries || []),
          releases: (parsed.releases && parsed.releases.length > 0) ? parsed.releases : (sample.releases || []),
          retros: (parsed.retros && parsed.retros.length > 0) ? parsed.retros : (defaultState.retros || []),
          features: parsed.features || defaultState.features || [],
          dropdowns: { ...defaultState.dropdowns, ...(parsed.dropdowns || {}) },
          customFields: parsed.customFields || defaultState.customFields || [],
          defCustomFields: parsed.defCustomFields || defaultState.defCustomFields || [],
          stepTemplates: parsed.stepTemplates || defaultState.stepTemplates || [],
          theme: finalTheme
        });
      } catch (e) {
        console.error('Failed to load project data', e);
      }
    } else {
      const sample = getWebSample();
      document.documentElement.setAttribute('data-theme', 'pulse');
      const activeView = urlView || 'overview';
      if (typeof window !== 'undefined') {
        window.history.replaceState({ view: activeView }, '', '#/' + activeView);
      }
      setState({
        ...getDefaultState(),
        ...sample as any,
        view: activeView,
        theme: 'pulse'
      });
    }
    setIsLoading(false);
  }, []);

  // Listen for browser Back/Forward navigation (popstate & hashchange)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocationChange = () => {
      const targetView = getViewFromURL() || 'overview';
      setState(prev => {
        if (prev.view === targetView) return prev;
        return { ...prev, view: targetView };
      });
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoading && state.name) {
      localStorage.setItem('pp-data', JSON.stringify(state));
    }
  }, [state, isLoading]);

  const addLog = useCallback((action: string, taskId: string, taskName: string, field = '', oldVal = '', newVal = '', comment = '') => {
    const t = state.tasks.find(x => x.id === taskId);
    const logEntry: LogEntry = {
      ts: nowISO(),
      action,
      taskId,
      taskName,
      field,
      oldVal,
      newVal,
      comment,
      module: t?.module || 'General',
      assignee: t?.assignee || 'Unassigned'
    };
    
    setState(prev => ({
      ...prev,
      log: [...prev.log, logEntry]
    }));
  }, [state.tasks]);

  const createTask = useCallback((data: Partial<Task>): Task => {
    const id = 'TASK-' + String(state.nextTaskId).padStart(3, '0');
    
    const newTask: Task = {
      id,
      name: '',
      status: TaskStatus.NOT_STARTED,
      priority: TaskPriority.MEDIUM,
      category: 'Feature',
      module: 'General',
      moduleType: 'Other',
      assignee: '',
      release: '',
      startDate: todayStr(),
      dueDate: todayStr(),
      actCompletionDate: null,
      progress: 0,
      estDays: 0,
      actDays: 0,
      dependsOn: [],
      notes: '',
      subtasks: [],
      guiScreens: [],
      createdAt: nowISO(),
      updatedAt: nowISO(),
      ...data
    };

    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
      nextTaskId: prev.nextTaskId + 1
    }));

    addLog('Created', id, newTask.name);
    return newTask;
  }, [state.nextTaskId, addLog]);

  const updateTask = useCallback((taskId: string, data: Partial<Task>, comment?: string) => {
    setState(prev => {
      const taskIndex = prev.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prev;

      const task = prev.tasks[taskIndex];
      const newTask = { ...task, ...data, updatedAt: nowISO() };

      // Business logic migrations
      if (data.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
        newTask.progress = 100;
        if (!newTask.actCompletionDate) newTask.actCompletionDate = todayStr();
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4F46E5', '#10B981', '#F59E0B']
        });
      }

      // Logging
      Object.entries(data).forEach(([key, val]) => {
        if (task[key] !== val) {
          // Internal call to addLog using prev state is tricky in setState, 
          // but we can just append to logs here if we had the logic.
          // For now, assume updateTask is where most mutations happen.
        }
      });

      const newTasks = [...prev.tasks];
      newTasks[taskIndex] = newTask;
      
      return { ...prev, tasks: newTasks };
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    const t = state.tasks.find(x => x.id === taskId);
    if (t) addLog('Deleted', taskId, t.name);
    
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId)
    }));
  }, [state.tasks, addLog]);

  const saveMember = useCallback((data: Partial<Member>, memberId?: string) => {
    setState(prev => {
      if (memberId) {
        return {
          ...prev,
          members: prev.members.map(m => m.id === memberId ? { ...m, ...data } : m)
        };
      } else {
        const id = 'MEM-' + String(prev.nextMemberId).padStart(3, '0');
        return {
          ...prev,
          members: [...prev.members, { 
            id, 
            name: '', role: '', status: 'Active', reportsTo: '', 
            email: '', phone: '', birthday: '', plannedLeaves: [], 
            ...data 
          } as Member],
          nextMemberId: prev.nextMemberId + 1
        };
      }
    });
  }, []);

  const deleteMember = useCallback((memberId: string) => {
    setState(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== memberId)
    }));
  }, []);

  const saveDefect = useCallback((data: Partial<Defect>, defectId?: string) => {
    setState(prev => {
      if (defectId) {
        return {
          ...prev,
          defects: prev.defects.map(d => d.id === defectId ? { ...d, ...data, updatedAt: nowISO() } : d)
        };
      } else {
        const id = 'DEF-' + String(prev.nextDefectId).padStart(3, '0');
        return {
          ...prev,
          defects: [...prev.defects, { 
            id, createdAt: nowISO(), updatedAt: nowISO(), 
            title: '', type: '', severity: '', priority: '', status: 'New',
            linkedType: 'Task', linkedId: '', assignee: '', reporter: '',
            desc: '', steps: '', ...data 
          } as Defect],
          nextDefectId: prev.nextDefectId + 1
        };
      }
    });
  }, []);

  const deleteDefect = useCallback((defectId: string) => {
    setState(prev => ({
      ...prev,
      defects: prev.defects.filter(d => d.id !== defectId)
    }));
  }, []);

  const saveDelivery = useCallback((data: Partial<Delivery>, deliveryId?: string) => {
    setState(prev => {
      const linkedTasks = data.linkedTasks || [];
      const linkedScreens = data.linkedScreens || [];
      const totalLinked = linkedTasks.length + linkedScreens.length;
      const linkedType: 'Multi' | 'Task' | 'Screen' | 'None' = 
        totalLinked > 1 ? 'Multi' : (linkedTasks.length === 1 ? 'Task' : (linkedScreens.length === 1 ? 'Screen' : 'None'));

      // Format linkedId for display (e.g. "TASK-001 : Task Name" or screen name)
      let linkedId = '';
      if (linkedTasks.length > 0) {
        const firstTask = prev.tasks.find(t => t.id === linkedTasks[0]);
        linkedId = firstTask ? `${firstTask.id} : ${firstTask.name}` : linkedTasks[0];
        if (totalLinked > 1) linkedId += ` (+${totalLinked - 1})`;
      } else if (linkedScreens.length > 0) {
        linkedId = linkedScreens[0];
        if (linkedScreens.length > 1) linkedId += ` (+${linkedScreens.length - 1})`;
      }

      if (deliveryId) {
        return {
          ...prev,
          deliveries: (prev.deliveries || []).map(d => {
            if (d.id !== deliveryId) return d;
            return {
              ...d,
              ...data,
              linkedType: data.linkedType || linkedType,
              linkedId: data.linkedId || linkedId || d.linkedId,
              updatedAt: nowISO()
            };
          })
        };
      } else {
        const id = 'DEL-' + String(prev.nextDeliveryId || 1).padStart(3, '0');
        const almId = data.almId || `ALM-${10000 + (prev.nextDeliveryId || 1)}`;
        const pdn = data.pdn || `PDN-${new Date().getFullYear()}-${String(prev.nextDeliveryId || 1).padStart(3, '0')}`;

        const newDelivery: Delivery = {
          id,
          almId,
          name: data.name || 'Unnamed Delivery',
          pdn,
          pdnProcessingDate: data.pdnProcessingDate || todayStr(),
          componentsDelivered: data.componentsDelivered || '',
          category: data.category || 'GSP++ Delivery',
          module: data.module || (prev.dropdowns.module?.[0] || 'Core Engine'),
          moduleType: data.moduleType || 'Server',
          releaseVersion: data.releaseVersion || (prev.dropdowns.version?.[0] || 'v1.1.0'),
          environment: data.environment || 'QA',
          almStatus: data.almStatus || 'New',
          status: data.status || 'Scheduled',
          signOffStatus: data.signOffStatus || 'Pending',
          approver: data.approver || '',
          smokeTestStatus: data.smokeTestStatus || 'Not Run',
          reportedBy: data.reportedBy || '',
          fixedBy: data.fixedBy || '',
          targetDeliveryDate: data.targetDeliveryDate || todayStr(),
          actualDeliveryDate: data.actualDeliveryDate || null,
          leadTimeDays: data.leadTimeDays || 0,
          variance: data.variance || 0,
          linkedType,
          linkedId,
          linkedTasks,
          linkedScreens,
          rollbackPlan: data.rollbackPlan || '',
          notes: data.notes || '',
          createdAt: nowISO(),
          updatedAt: nowISO(),
          ...data
        };

        return {
          ...prev,
          deliveries: [...(prev.deliveries || []), newDelivery],
          nextDeliveryId: (prev.nextDeliveryId || 1) + 1
        };
      }
    });
  }, []);

  const deleteDelivery = useCallback((deliveryId: string) => {
    setState(prev => ({
      ...prev,
      deliveries: (prev.deliveries || []).filter(d => d.id !== deliveryId)
    }));
  }, []);

  const batchUpdateDeliveries = useCallback((ids: string[], updates: Partial<Delivery>) => {
    setState(prev => ({
      ...prev,
      deliveries: (prev.deliveries || []).map(d => ids.includes(d.id) ? { ...d, ...updates, updatedAt: nowISO() } : d)
    }));
  }, []);

  const setView = useCallback((view: string, replace = false) => {
    setState(prev => {
      if (prev.view === view) return prev;
      return { ...prev, view };
    });
    if (typeof window !== 'undefined') {
      const targetHash = '#/' + view;
      if (window.location.hash !== targetHash) {
        if (replace) {
          window.history.replaceState({ view }, '', targetHash);
        } else {
          window.history.pushState({ view }, '', targetHash);
        }
      }
    }
  }, []);

  const setTheme = useCallback((theme: string) => {
    setState(prev => ({ ...prev, theme }));
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const updateSettings = useCallback((settings: Partial<ProjectState['settings']>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
  }, []);

  const updateProject = useCallback((data: Partial<ProjectState>) => {
    setState(prev => ({ ...prev, ...data }));
  }, []);

  const resetProject = useCallback((name: string, desc: string, team: string[]) => {
    const initialState = getDefaultState();
    initialState.name = name;
    initialState.desc = desc;
    
    let nextMemId = 1;
    initialState.members = team.map(name => ({
      id: 'MEM-' + String(nextMemId++).padStart(3, '0'),
      name,
      role: '',
      status: 'Active',
      reportsTo: '',
      email: '',
      phone: '',
      birthday: '',
      plannedLeaves: []
    }));
    initialState.nextMemberId = nextMemId;
    
    setState(initialState);
  }, []);

  const clearAllData = useCallback(() => {
    setState(getDefaultState());
  }, []);

  return (
    <ProjectContext.Provider value={{ 
      state, createTask, updateTask, deleteTask, 
      saveMember, deleteMember, saveDefect, deleteDefect,
      saveDelivery, deleteDelivery, batchUpdateDeliveries,
      addLog, setView, setTheme, updateSettings, updateProject,
      resetProject, loadSample, clearAllData, isLoading,
      searchTerm, setSearchTerm
    }}>
      {!isLoading && children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
