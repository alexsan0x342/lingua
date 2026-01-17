import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { canAccessAdminPanel, canManageUsers, canCreateCourses, canViewAllAnalytics, canManageLiveLessons, hasPermission, PERMISSIONS, UserRole } from '@/lib/rbac';
import aj, { fixedWindow } from '@/lib/arcjet';

interface RoutePermission {
  path: string;
  permission: (role: UserRole | null) => boolean;
  methods?: string[];
}

// Define specific permissions for each admin route
const ADMIN_ROUTE_PERMISSIONS: RoutePermission[] = [
  // User management - Only admins can manage users
  { 
    path: '/api/admin/users', 
    permission: canManageUsers,
  },
  { 
    path: '/api/admin/users/role', 
    permission: canManageUsers,
  },
  { 
    path: '/api/admin/users/ban', 
    permission: canManageUsers,
  },
  { 
    path: '/api/admin/users/enroll', 
    permission: canManageUsers,
  },
  { 
    path: '/api/admin/users/revoke', 
    permission: canManageUsers,
  },
  
  // Course management - Managers and admins can create courses
  { 
    path: '/api/admin/courses', 
    permission: canCreateCourses,
  },
  
  // Analytics - Managers and admins can view analytics  
  { 
    path: '/api/admin/analytics', 
    permission: canViewAllAnalytics,
  },
  
  // Live lessons - Teachers, managers, and admins can manage
  { 
    path: '/api/admin/live-lessons', 
    permission: canManageLiveLessons,
  },
  
  // Content management - Admin only
  { 
    path: '/api/admin/branding', 
    permission: (role) => hasPermission(role, PERMISSIONS.ADMIN_PANEL),
  },
  { 
    path: '/api/admin/homepage', 
    permission: (role) => hasPermission(role, PERMISSIONS.ADMIN_PANEL),
  },
  { 
    path: '/api/admin/pages', 
    permission: (role) => hasPermission(role, PERMISSIONS.ADMIN_PANEL),
  },
  { 
    path: '/api/admin/send-email', 
    permission: (role) => hasPermission(role, PERMISSIONS.ADMIN_PANEL),
  },
  { 
    path: '/api/admin/send-grade-email', 
    permission: (role) => hasPermission(role, PERMISSIONS.ADMIN_PANEL),
  },
  
  // System tools - Admin only
  { 
    path: '/api/admin/debug-lessons', 
    permission: (role) => role === 'ADMIN',
  },
  { 
    path: '/api/admin/migrate-playback-ids', 
    permission: (role) => role === 'ADMIN',
  },
  { 
    path: '/api/admin/cleanup', 
    permission: (role) => role === 'ADMIN',
  },
  { 
    path: '/api/admin/files/delete', 
    permission: (role) => role === 'ADMIN',
  },
];

function findRoutePermission(pathname: string): RoutePermission | null {
  // Check for exact matches first
  const exactMatch = ADMIN_ROUTE_PERMISSIONS.find(route => route.path === pathname);
  if (exactMatch) return exactMatch;
  
  // Check for partial matches (for dynamic routes)
  const partialMatch = ADMIN_ROUTE_PERMISSIONS.find(route => 
    pathname.startsWith(route.path)
  );
  if (partialMatch) return partialMatch;
  
  return null;
}

export async function adminApiMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  
  // Only apply to admin API routes
  if (!pathname.startsWith('/api/admin/')) {
    return null;
  }

  // Apply Arcjet protection for admin routes with stricter limits  
  const decision = await aj
    .withRule(
      fixedWindow({
        mode: process.env.NODE_ENV === 'development' ? "DRY_RUN" : "LIVE",
        window: "1m",
        max: process.env.NODE_ENV === 'development' ? 100 : 30, // Stricter limit for admin routes
      })
    )
    .protect(request);

  if (decision.isDenied() && process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Rate limit exceeded for admin endpoints' },
      { status: 429 }
    );
  }

  try {
    // Get session
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = session.user.role as UserRole | null;

    // Check if user can access admin panel at all
    if (!canAccessAdminPanel(userRole)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Find specific route permission
    const routePermission = findRoutePermission(pathname);
    
    if (routePermission) {
      // Check method-specific permissions if defined
      if (routePermission.methods && routePermission.methods.length > 0) {
        if (!routePermission.methods.includes(request.method)) {
          return NextResponse.json(
            { error: 'Method not allowed for your role' },
            { status: 405 }
          );
        }
      }

      // Check role-specific permission
      if (!routePermission.permission(userRole)) {
        return NextResponse.json(
          { error: 'Insufficient permissions for this action' },
          { status: 403 }
        );
      }
    } else {
      // Default: require admin panel access for unknown admin routes
      if (!hasPermission(userRole, PERMISSIONS.ADMIN_PANEL)) {
        return NextResponse.json(
          { error: 'Admin permissions required' },
          { status: 403 }
        );
      }
    }

    return null; // Allow request to continue
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 500 }
    );
  }
}
