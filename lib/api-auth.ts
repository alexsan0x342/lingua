import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { canAccessAdminPanel, canManageUsers, canCreateCourses, canViewAllAnalytics, canManageLiveLessons, hasPermission, PERMISSIONS, UserRole } from '@/lib/rbac';

interface AuthResult {
  authorized: boolean;
  user?: any;
  error?: { message: string; status: number };
}

export async function authenticateAdmin(request: NextRequest): Promise<AuthResult> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return {
        authorized: false,
        error: { message: 'Authentication required', status: 401 }
      };
    }

    const userRole = session.user.role as UserRole | null;

    if (!canAccessAdminPanel(userRole)) {
      return {
        authorized: false,
        error: { message: 'Admin access required', status: 403 }
      };
    }

    return {
      authorized: true,
      user: session.user
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      authorized: false,
      error: { message: 'Authentication error', status: 500 }
    };
  }
}

export async function authorizeUserManagement(request: NextRequest): Promise<AuthResult> {
  const authResult = await authenticateAdmin(request);
  if (!authResult.authorized) return authResult;

  const userRole = authResult.user.role as UserRole | null;
  if (!canManageUsers(userRole)) {
    return {
      authorized: false,
      error: { message: 'User management permissions required', status: 403 }
    };
  }

  return authResult;
}

export async function authorizeCourseManagement(request: NextRequest): Promise<AuthResult> {
  const authResult = await authenticateAdmin(request);
  if (!authResult.authorized) return authResult;

  const userRole = authResult.user.role as UserRole | null;
  if (!canCreateCourses(userRole)) {
    return {
      authorized: false,
      error: { message: 'Course management permissions required', status: 403 }
    };
  }

  return authResult;
}

export async function authorizeAnalyticsAccess(request: NextRequest): Promise<AuthResult> {
  const authResult = await authenticateAdmin(request);
  if (!authResult.authorized) return authResult;

  const userRole = authResult.user.role as UserRole | null;
  if (!canViewAllAnalytics(userRole)) {
    return {
      authorized: false,
      error: { message: 'Analytics access permissions required', status: 403 }
    };
  }

  return authResult;
}

export async function authorizeLiveLessonsAccess(request: NextRequest): Promise<AuthResult> {
  const authResult = await authenticateAdmin(request);
  if (!authResult.authorized) return authResult;

  const userRole = authResult.user.role as UserRole | null;
  if (!canManageLiveLessons(userRole)) {
    return {
      authorized: false,
      error: { message: 'Live lessons management permissions required', status: 403 }
    };
  }

  return authResult;
}

export async function authorizeSystemAccess(request: NextRequest): Promise<AuthResult> {
  const authResult = await authenticateAdmin(request);
  if (!authResult.authorized) return authResult;

  const userRole = authResult.user.role as UserRole | null;
  if (userRole !== 'ADMIN') {
    return {
      authorized: false,
      error: { message: 'System administrator access required', status: 403 }
    };
  }

  return authResult;
}
