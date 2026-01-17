// Utility to generate protected admin pages with role-based access
import { ReactNode } from "react";
import { RoleBasedWrapper } from "@/components/auth/RoleBasedWrapper";
import { 
  canManageUsers, 
  canCreateCourses, 
  canViewAllAnalytics, 
  canManageLiveLessons,
  hasPermission,
  PERMISSIONS,
  UserRole 
} from "@/lib/rbac";

interface ProtectedPageProps {
  children: ReactNode;
  type: 'users' | 'courses' | 'analytics' | 'live-lessons' | 'admin-only' | 'system-tools';
}

export function ProtectedAdminPage({ children, type }: ProtectedPageProps) {
  const getPermissionCheck = (pageType: string) => {
    switch (pageType) {
      case 'users':
        return canManageUsers;
      case 'courses':
        return canCreateCourses;
      case 'analytics':
        return canViewAllAnalytics;
      case 'live-lessons':
        return canManageLiveLessons;
      case 'admin-only':
        return (role: UserRole | null) => hasPermission(role, PERMISSIONS.ADMIN_PANEL);
      case 'system-tools':
        return (role: UserRole | null) => role === 'ADMIN';
      default:
        return (role: UserRole | null) => hasPermission(role, PERMISSIONS.ADMIN_PANEL);
    }
  };

  return (
    <RoleBasedWrapper
      requiredPermission={getPermissionCheck(type)}
      fallback={
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      }
    >
      {children}
    </RoleBasedWrapper>
  );
}
