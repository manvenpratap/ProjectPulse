import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  ProjectState, Task, Member, Defect, ProjectReport, 
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
  addLog: (action: string, taskId: string, taskName: string, field?: string, oldVal?: string, newVal?: string, comment?: string) => void;
  setView: (view: string) => void;
  setTheme: (theme: string) => void;
  updateSettings: (settings: Partial<ProjectState['settings']>) => void;
  resetProject: (name: string, desc: string, team: string[]) => void;
  loadSample: (type: 'web' | 'mobile') => void;
  clearAllData: () => void;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ProjectState>(getDefaultState());
  const [isLoading, setIsLoading] = useState(true);

  const loadSample = useCallback((type: 'web' | 'mobile') => {
    if (type === 'web') {
      setState(getWebSample() as ProjectState);
    } else {
      // Could add mobile sample later
      setState(getWebSample() as ProjectState);
    }
  }, []);


  // Load from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('pp-data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Basic migration/merge with default state to ensure new keys exist
        setState({ ...getDefaultState(), ...parsed });
      } catch (e) {
        console.error('Failed to load project data', e);
      }
    }
    setIsLoading(false);
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
      estHours: 0,
      actHours: 0,
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

  const setView = useCallback((view: string) => {
    setState(prev => ({ ...prev, view }));
  }, []);

  const setTheme = useCallback((theme: string) => {
    setState(prev => ({ ...prev, theme }));
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const updateSettings = useCallback((settings: Partial<ProjectState['settings']>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
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
      addLog, setView, setTheme, updateSettings, 
      resetProject, loadSample, clearAllData, isLoading 
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
