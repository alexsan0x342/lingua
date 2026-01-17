export type UserRole = 'STUDENT' | 'MANAGER' | 'ADMIN';

export interface Permission {
  resource: string;
  action: string;
}

export const PERMISSIONS = {
  // Live Lessons
  LIVE_LESSONS_VIEW: { resource: 'live-lessons', action: 'view' },
  LIVE_LESSONS_CREATE: { resource: 'live-lessons', action: 'create' },
  LIVE_LESSONS_EDIT: { resource: 'live-lessons', action: 'edit' },
  LIVE_LESSONS_DELETE: { resource: 'live-lessons', action: 'delete' },
  LIVE_LESSONS_START: { resource: 'live-lessons', action: 'start' },
  LIVE_LESSONS_CONTROL: { resource: 'live-lessons', action: 'control' },
  
  // Courses
  COURSES_VIEW: { resource: 'courses', action: 'view' },
  COURSES_CREATE: { resource: 'courses', action: 'create' },
  COURSES_EDIT: { resource: 'courses', action: 'edit' },
  COURSES_DELETE: { resource: 'courses', action: 'delete' },
  COURSES_ANALYTICS: { resource: 'courses', action: 'analytics' },
  
  // Users
  USERS_VIEW: { resource: 'users', action: 'view' },
  USERS_EDIT: { resource: 'users', action: 'edit' },
  USERS_MANAGE_ROLES: { resource: 'users', action: 'manage-roles' },
  
  // Admin
  ADMIN_PANEL: { resource: 'admin', action: 'access' },
  SYSTEM_SETTINGS: { resource: 'system', action: 'settings' },
  ALL_ANALYTICS: { resource: 'analytics', action: 'view-all' },
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  STUDENT: [
    // Students can only view their enrolled courses and lessons
  ],
  
  MANAGER: [
    PERMISSIONS.ADMIN_PANEL,
    PERMISSIONS.LIVE_LESSONS_VIEW,
    PERMISSIONS.LIVE_LESSONS_CREATE,
    PERMISSIONS.LIVE_LESSONS_EDIT,
    PERMISSIONS.LIVE_LESSONS_DELETE,
    PERMISSIONS.LIVE_LESSONS_START,
    PERMISSIONS.LIVE_LESSONS_CONTROL,
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.COURSES_CREATE,
    PERMISSIONS.COURSES_EDIT,
    PERMISSIONS.COURSES_DELETE,
    PERMISSIONS.COURSES_ANALYTICS, // Only their own courses
  ],
  
  ADMIN: [
    // Admin has all permissions
    PERMISSIONS.ADMIN_PANEL,
    PERMISSIONS.LIVE_LESSONS_VIEW,
    PERMISSIONS.LIVE_LESSONS_CREATE,
    PERMISSIONS.LIVE_LESSONS_EDIT,
    PERMISSIONS.LIVE_LESSONS_DELETE,
    PERMISSIONS.LIVE_LESSONS_START,
    PERMISSIONS.LIVE_LESSONS_CONTROL,
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.COURSES_CREATE,
    PERMISSIONS.COURSES_EDIT,
    PERMISSIONS.COURSES_DELETE,
    PERMISSIONS.COURSES_ANALYTICS,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_MANAGE_ROLES,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.ALL_ANALYTICS,
  ],
};

export function hasPermission(userRole: UserRole | null | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions.some(p => 
    p.resource === permission.resource && p.action === permission.action
  );
}

export function canAccessAdminPanel(userRole: UserRole | null | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.ADMIN_PANEL);
}

export function canManageUsers(userRole: UserRole | null | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.USERS_MANAGE_ROLES);
}

export function canCreateCourses(userRole: UserRole | null | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.COURSES_CREATE);
}

export function canViewAllAnalytics(userRole: UserRole | null | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.ALL_ANALYTICS);
}

export function canViewAnalytics(userRole: UserRole | null | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.ALL_ANALYTICS) || hasPermission(userRole, PERMISSIONS.COURSES_ANALYTICS);
}

export function canManageLiveLessons(userRole: UserRole | null | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.LIVE_LESSONS_CREATE);
}

// Helper to check if user can view analytics for specific courses
export function canViewCourseAnalytics(userRole: UserRole | null | undefined, courseOwnerId: string, userId: string): boolean {
  if (!userRole) return false;
  
  // Admin can view all analytics
  if (userRole === 'ADMIN') return true;
  
  // Manager can only view analytics for their own courses
  if (userRole === 'MANAGER') return courseOwnerId === userId;
  
  return false;
}
