import { UserRole } from "./rbac";

export interface DynamicPermission {
  id: string;
  resource: string;
  action: string;
  description: string;
}

export interface DynamicRolePermissions {
  role: UserRole;
  permissions: string[];
  dashboardConfig: {
    showUsers: boolean;
    showCourses: boolean;
    showAnalytics: boolean;
    showLiveLessons: boolean;
    showFileCleanup: boolean;
    showRecentCourses: boolean;
    customWelcomeMessage?: string;
    allowedQuickActions: string[];
  };
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  variant: "default" | "secondary" | "outline";
  requiredPermission?: string;
}

// Default permissions that are always available
export const DEFAULT_PERMISSIONS: DynamicPermission[] = [
  {
    id: "users_view",
    resource: "users",
    action: "view",
    description: "View user list and profiles",
  },
  {
    id: "users_edit",
    resource: "users",
    action: "edit",
    description: "Edit user information and roles",
  },
  {
    id: "users_manage_roles",
    resource: "users",
    action: "manage-roles",
    description: "Change user roles and permissions",
  },
  {
    id: "courses_view",
    resource: "courses",
    action: "view",
    description: "View course list",
  },
  {
    id: "courses_create",
    resource: "courses",
    action: "create",
    description: "Create new courses",
  },
  {
    id: "courses_edit",
    resource: "courses",
    action: "edit",
    description: "Edit existing courses",
  },
  {
    id: "courses_delete",
    resource: "courses",
    action: "delete",
    description: "Delete courses",
  },
  {
    id: "courses_analytics",
    resource: "courses",
    action: "analytics",
    description: "View course analytics",
  },
  {
    id: "live_lessons_view",
    resource: "live-lessons",
    action: "view",
    description: "View live lessons",
  },
  {
    id: "live_lessons_create",
    resource: "live-lessons",
    action: "create",
    description: "Create live lessons",
  },
  {
    id: "live_lessons_edit",
    resource: "live-lessons",
    action: "edit",
    description: "Edit live lessons",
  },
  {
    id: "live_lessons_delete",
    resource: "live-lessons",
    action: "delete",
    description: "Delete live lessons",
  },
  {
    id: "codes_view",
    resource: "codes",
    action: "view",
    description: "View redemption codes",
  },
  {
    id: "codes_create",
    resource: "codes",
    action: "create",
    description: "Create redemption codes",
  },
  {
    id: "codes_edit",
    resource: "codes",
    action: "edit",
    description: "Edit redemption codes",
  },
  {
    id: "codes_delete",
    resource: "codes",
    action: "delete",
    description: "Delete redemption codes",
  },
  {
    id: "analytics_view_all",
    resource: "analytics",
    action: "view-all",
    description: "View all system analytics",
  },
  {
    id: "admin_panel",
    resource: "admin",
    action: "access",
    description: "Access admin panel",
  },
  {
    id: "system_settings",
    resource: "system",
    action: "settings",
    description: "Manage system settings",
  },
];

// Default quick actions
export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "manage_users",
    title: "Manage Users",
    description: "View and manage user accounts, roles, and permissions",
    href: "/admin/users",
    icon: "Users",
    variant: "default",
    requiredPermission: "users_manage_roles",
  },
  {
    id: "view_analytics",
    title: "View Analytics",
    description: "View comprehensive analytics and reports",
    href: "/admin/analytics",
    icon: "BarChart3",
    variant: "secondary",
    requiredPermission: "analytics_view_all",
  },
  {
    id: "manage_courses",
    title: "Manage Courses",
    description: "Create, edit, and manage courses",
    href: "/admin/courses",
    icon: "BookOpen",
    variant: "default",
    requiredPermission: "courses_create",
  },
  {
    id: "my_analytics",
    title: "My Analytics",
    description: "View analytics for your courses",
    href: "/admin/analytics",
    icon: "BarChart3",
    variant: "secondary",
    requiredPermission: "courses_analytics",
  },
  {
    id: "live_lessons",
    title: "Live Lessons",
    description: "Schedule and manage live lessons",
    href: "/admin/live-lessons",
    icon: "Video",
    variant: "default",
    requiredPermission: "live_lessons_create",
  },
  {
    id: "permissions",
    title: "Permissions Manager",
    description: "Configure role-based permissions and dashboard settings",
    href: "/admin/permissions",
    icon: "Shield",
    variant: "outline",
    requiredPermission: "system_settings",
  },
];

// Default role configurations
export const DEFAULT_ROLE_PERMISSIONS: DynamicRolePermissions[] = [
  {
    role: "STUDENT",
    permissions: [],
    dashboardConfig: {
      showUsers: false,
      showCourses: false,
      showAnalytics: false,
      showLiveLessons: false,
      showFileCleanup: false,
      showRecentCourses: false,
      allowedQuickActions: [],
    },
  },
  {
    role: "MANAGER",
    permissions: [
      "admin_panel",
      "live_lessons_view",
      "live_lessons_create",
      "live_lessons_edit",
      "live_lessons_delete",
      "courses_view",
      "courses_create",
      "courses_edit",
      "courses_analytics",
    ],
    dashboardConfig: {
      showUsers: false,
      showCourses: true,
      showAnalytics: true,
      showLiveLessons: true,
      showFileCleanup: false,
      showRecentCourses: true,
      customWelcomeMessage: "Manage your courses and view your analytics.",
      allowedQuickActions: ["manage_courses", "my_analytics", "live_lessons"],
    },
  },
  {
    role: "ADMIN",
    permissions: [
      "admin_panel",
      "users_view",
      "users_edit",
      "users_manage_roles",
      "courses_view",
      "courses_create",
      "courses_edit",
      "courses_delete",
      "courses_analytics",
      "live_lessons_view",
      "live_lessons_create",
      "live_lessons_edit",
      "live_lessons_delete",
      "codes_view",
      "codes_create",
      "codes_edit",
      "codes_delete",
      "analytics_view_all",
      "system_settings",
    ],
    dashboardConfig: {
      showUsers: true,
      showCourses: true,
      showAnalytics: true,
      showLiveLessons: true,
      showFileCleanup: true,
      showRecentCourses: true,
      customWelcomeMessage: "Full access to manage the learning platform.",
      allowedQuickActions: [
        "manage_users",
        "view_analytics",
        "manage_courses",
        "live_lessons",
        "permissions",
      ],
    },
  },
];

// Storage key for localStorage
const PERMISSIONS_STORAGE_KEY = "dynamic_role_permissions";
const CUSTOM_PERMISSIONS_KEY = "custom_permissions";
const CUSTOM_ACTIONS_KEY = "custom_quick_actions";

/**
 * Get role permissions from storage or defaults
 */
export function getDynamicRolePermissions(): DynamicRolePermissions[] {
  if (typeof window === "undefined") {
    return DEFAULT_ROLE_PERMISSIONS;
  }

  try {
    const stored = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading dynamic permissions:", error);
  }

  return DEFAULT_ROLE_PERMISSIONS;
}

/**
 * Save role permissions to storage
 */
export function saveDynamicRolePermissions(
  permissions: DynamicRolePermissions[],
): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(permissions));
  } catch (error) {
    console.error("Error saving dynamic permissions:", error);
  }
}

/**
 * Get custom permissions from storage or defaults
 */
export function getCustomPermissions(): DynamicPermission[] {
  if (typeof window === "undefined") {
    return DEFAULT_PERMISSIONS;
  }

  try {
    const stored = localStorage.getItem(CUSTOM_PERMISSIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading custom permissions:", error);
  }

  return DEFAULT_PERMISSIONS;
}

/**
 * Save custom permissions to storage
 */
export function saveCustomPermissions(permissions: DynamicPermission[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CUSTOM_PERMISSIONS_KEY, JSON.stringify(permissions));
  } catch (error) {
    console.error("Error saving custom permissions:", error);
  }
}

/**
 * Get custom quick actions from storage or defaults
 */
export function getCustomQuickActions(): QuickAction[] {
  if (typeof window === "undefined") {
    return DEFAULT_QUICK_ACTIONS;
  }

  try {
    const stored = localStorage.getItem(CUSTOM_ACTIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading custom quick actions:", error);
  }

  return DEFAULT_QUICK_ACTIONS;
}

/**
 * Save custom quick actions to storage
 */
export function saveCustomQuickActions(actions: QuickAction[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CUSTOM_ACTIONS_KEY, JSON.stringify(actions));
  } catch (error) {
    console.error("Error saving custom quick actions:", error);
  }
}

/**
 * Check if a user has a specific permission
 */
export function hasDynamicPermission(
  userRole: UserRole | string | null | undefined,
  permissionId: string,
): boolean {
  if (!userRole) return false;

  // Normalize role to uppercase to match enum values
  const normalizedRole = (
    typeof userRole === "string" ? userRole.toUpperCase() : userRole
  ) as UserRole;

  const rolePermissions = getDynamicRolePermissions();
  const roleConfig = rolePermissions.find((rp) => rp.role === normalizedRole);

  return roleConfig?.permissions.includes(permissionId) ?? false;
}

/**
 * Get dashboard configuration for a role
 */
export function getDashboardConfig(
  userRole: UserRole,
): DynamicRolePermissions | null {
  const rolePermissions = getDynamicRolePermissions();
  return rolePermissions.find((rp) => rp.role === userRole) ?? null;
}

/**
 * Get filtered quick actions for a role
 */
export function getFilteredQuickActions(userRole: UserRole): QuickAction[] {
  const config = getDashboardConfig(userRole);
  if (!config) return [];

  const quickActions = getCustomQuickActions();
  const allowedActionIds = config.dashboardConfig.allowedQuickActions;

  return quickActions.filter((action) => {
    // Check if action is allowed for this role
    if (!allowedActionIds.includes(action.id)) return false;

    // Check if user has required permission
    if (action.requiredPermission) {
      return hasDynamicPermission(userRole, action.requiredPermission);
    }

    return true;
  });
}

/**
 * Check if user can access admin panel
 */
export function canAccessAdminPanel(
  userRole: UserRole | null | undefined,
): boolean {
  return hasDynamicPermission(userRole, "admin_panel");
}

/**
 * Reset all permissions to defaults
 */
export function resetPermissionsToDefaults(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
  localStorage.removeItem(CUSTOM_PERMISSIONS_KEY);
  localStorage.removeItem(CUSTOM_ACTIONS_KEY);
}
