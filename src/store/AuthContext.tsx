import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole, RolePermissions, UserAccount } from '../types';

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  'Admin': {
    role: 'Admin',
    description: 'Full unrestricted governance, user management, schema architecture, and project controls.',
    allowedViews: ['*'],
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: true,
    canManageSettings: true,
    canManageUsers: true,
    canExportExcel: true,
    canManageDeliveries: true,
    canManageReleases: true,
    canManageRAID: true,
  },
  'Project Manager': {
    role: 'Project Manager',
    description: 'Work planning, sprint execution, resource leveling, risk monitoring, and reporting.',
    allowedViews: [
      'overview', 'dash', 'reports', 'tasks', 'deliveries', 
      'timeline', 'releases', 'scheduler', 'team', 'capacity', 
      'defects', 'risks', 'retro', 'log', 'features'
    ],
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: true,
    canManageSettings: false,
    canManageUsers: false,
    canExportExcel: true,
    canManageDeliveries: true,
    canManageReleases: true,
    canManageRAID: true,
  },
  'Developer': {
    role: 'Developer',
    description: 'Individual task delivery, defect identification, progress updates, and team directory.',
    allowedViews: [
      'overview', 'tasks', 'deliveries', 'timeline', 'team', 'defects', 'risks'
    ],
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: false,
    canManageSettings: false,
    canManageUsers: false,
    canExportExcel: false,
    canManageDeliveries: false,
    canManageReleases: false,
    canManageRAID: false,
  },
  'Stakeholder': {
    role: 'Stakeholder',
    description: 'Read-only access to high-level executive health, roadmap milestones, and pulse reports.',
    allowedViews: [
      'overview', 'dash', 'reports', 'timeline', 'releases'
    ],
    canCreateTask: false,
    canEditTask: false,
    canDeleteTask: false,
    canManageSettings: false,
    canManageUsers: false,
    canExportExcel: true,
    canManageDeliveries: false,
    canManageReleases: false,
    canManageRAID: false,
  }
};

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-admin',
    email: 'admin@projectpulse.io',
    name: 'Sarah Chen',
    role: 'Admin',
    title: 'Engineering Director & System Admin',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user-pm',
    email: 'pm@projectpulse.io',
    name: 'Alex Rivera',
    role: 'Project Manager',
    title: 'Technical Program Manager',
    createdAt: '2026-01-05T00:00:00.000Z'
  },
  {
    id: 'user-dev',
    email: 'dev@projectpulse.io',
    name: 'Marcus Vance',
    role: 'Developer',
    title: 'Senior Backend Engineer',
    createdAt: '2026-01-10T00:00:00.000Z'
  },
  {
    id: 'user-viewer',
    email: 'viewer@projectpulse.io',
    name: 'Elena Rostova',
    role: 'Stakeholder',
    title: 'Executive Stakeholder',
    createdAt: '2026-01-15T00:00:00.000Z'
  }
];

interface AuthContextType {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  users: UserAccount[];
  rolePermissions: Record<UserRole, RolePermissions>;
  login: (email: string, password?: string) => { success: boolean; error?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  updateUserCustomViews: (userId: string, allowedViews: string[] | undefined) => void;
  updateRolePermissions: (role: UserRole, permissions: Partial<RolePermissions>) => void;
  createUser: (userData: { name: string; email: string; role: UserRole; title?: string }) => void;
  deleteUser: (userId: string) => void;
  hasViewAccess: (viewId: string) => boolean;
  canPerform: (action: keyof Omit<RolePermissions, 'role' | 'description' | 'allowedViews'>) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('pp-auth-users');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse pp-auth-users', e);
    }
    return INITIAL_USERS;
  });

  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RolePermissions>>(() => {
    try {
      const saved = localStorage.getItem('pp-auth-roles');
      if (saved) {
        return { ...DEFAULT_ROLE_PERMISSIONS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse pp-auth-roles', e);
    }
    return DEFAULT_ROLE_PERMISSIONS;
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('pp-auth-user');
      if (saved !== null) {
        return saved === 'null' || saved === '' ? null : saved;
      }
    } catch (e) {
      console.warn('Failed to parse pp-auth-user', e);
    }
    // Default to the first admin account so existing tests/features load seamlessly
    return 'user-admin';
  });

  // Save users list changes
  useEffect(() => {
    localStorage.setItem('pp-auth-users', JSON.stringify(users));
  }, [users]);

  // Save role permissions changes
  useEffect(() => {
    localStorage.setItem('pp-auth-roles', JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  // Save current user session
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem('pp-auth-user', currentUserId);
    } else {
      localStorage.setItem('pp-auth-user', '');
    }
  }, [currentUserId]);

  const currentUser = users.find(u => u.id === currentUserId) || null;
  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === 'Admin';

  const login = useCallback((email: string, _password?: string) => {
    const trimmed = email.trim().toLowerCase();
    const found = users.find(u => u.email.toLowerCase() === trimmed);
    if (found) {
      setCurrentUserId(found.id);
      return { success: true };
    }
    return { success: false, error: 'User account with this email not found. Choose a demo persona or create an account.' };
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUserId(null);
  }, []);

  const switchUser = useCallback((userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUserId(found.id);
    }
  }, [users]);

  // Admin provides/changes access: Role modification
  const updateUserRole = useCallback((userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  }, []);

  // Admin provides/changes access: Granular custom allowed views
  const updateUserCustomViews = useCallback((userId: string, allowedViews: string[] | undefined) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, allowedViews } : u));
  }, []);

  // Admin updates default role permissions
  const updateRolePermissions = useCallback((role: UserRole, permissions: Partial<RolePermissions>) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: { ...prev[role], ...permissions }
    }));
  }, []);

  const createUser = useCallback((userData: { name: string; email: string; role: UserRole; title?: string }) => {
    const newUser: UserAccount = {
      id: `user-${Date.now().toString(36)}`,
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      role: userData.role,
      title: userData.title?.trim() || undefined,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUserId === userId) {
      // Fallback to first remaining admin or null
      setCurrentUserId(users.find(u => u.id !== userId && u.role === 'Admin')?.id || null);
    }
  }, [currentUserId, users]);

  // Permission evaluation
  const hasViewAccess = useCallback((viewId: string): boolean => {
    if (!currentUser) return false;
    
    // Admin has universal view access unless explicitly overridden
    if (currentUser.role === 'Admin') return true;

    // Custom per-user override takes priority if defined
    if (currentUser.allowedViews && currentUser.allowedViews.length > 0) {
      if (currentUser.allowedViews.includes('*') || currentUser.allowedViews.includes(viewId)) return true;
      return false;
    }

    // Role-level view access
    const roleConfig = rolePermissions[currentUser.role];
    if (!roleConfig) return false;
    if (roleConfig.allowedViews.includes('*')) return true;
    return roleConfig.allowedViews.includes(viewId);
  }, [currentUser, rolePermissions]);

  const canPerform = useCallback((action: keyof Omit<RolePermissions, 'role' | 'description' | 'allowedViews'>): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;

    const roleConfig = rolePermissions[currentUser.role];
    if (!roleConfig) return false;
    return !!roleConfig[action];
  }, [currentUser, rolePermissions]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated,
      users,
      rolePermissions,
      login,
      logout,
      switchUser,
      updateUserRole,
      updateUserCustomViews,
      updateRolePermissions,
      createUser,
      deleteUser,
      hasViewAccess,
      canPerform,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
