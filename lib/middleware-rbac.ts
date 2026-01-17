import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/rbac';
import { canAccessAdminPanel, hasDynamicPermission } from '@/lib/dynamic-rbac';

export async function withRoleProtection(
  request: NextRequest,
  requiredPermission?: (role: UserRole | null) => boolean
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role as UserRole | null;

    // Check if user can access admin panel
    if (!canAccessAdminPanel(userRole)) {
      return NextResponse.json({ 
        error: 'Access denied. Insufficient permissions.' 
      }, { status: 403 });
    }

    // Check additional permission if provided
    if (requiredPermission && !requiredPermission(userRole)) {
      return NextResponse.json({ 
        error: 'Access denied. Insufficient permissions for this resource.' 
      }, { status: 403 });
    }

    return null; // Permission granted, continue
  } catch (error) {
    console.error('Role protection error:', error);
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
  }
}

export function withAdminOnly() {
  return (role: UserRole | null) => hasDynamicPermission(role, 'system_settings');
}

export function withManagerOrAdmin() {
  return (role: UserRole | null) => 
    hasDynamicPermission(role, 'courses_create') || hasDynamicPermission(role, 'system_settings');
}

export function withTeacherOrAbove() {
  return (role: UserRole | null) => 
    hasDynamicPermission(role, 'live_lessons_create') || 
    hasDynamicPermission(role, 'courses_create') || 
    hasDynamicPermission(role, 'system_settings');
}

export function withPermission(permissionId: string) {
  return (role: UserRole | null) => hasDynamicPermission(role, permissionId);
}
