import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const requireAdmin = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to login if no session
  if (!session?.user?.id) {
    return redirect("/login");
  }

  const userRole = session.user.role;
  
  // Allow ADMIN and MANAGER roles
  if (!userRole || (userRole !== 'ADMIN' && userRole !== 'MANAGER')) {
    return redirect("/not-admin");
  }

  // Additional security check - ensure user is not banned or has valid permissions
  if (session.user.banned === true) {
    return redirect("/login");
  }

  return session;
});

// All permission checks now just require ADMIN role
export const requireUserManagement = requireAdmin;
export const requireCourseManagement = requireAdmin;
export const requireAnalyticsAccess = requireAdmin;
export const requireLiveLessonsAccess = requireAdmin;
export const requireSystemAccess = requireAdmin;

// Strict admin-only function for sensitive operations
export const requireStrictAdmin = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to login if no session
  if (!session?.user?.id) {
    return redirect("/login");
  }

  const userRole = session.user.role;
  
  // Strict role verification - only allow ADMIN
  if (!userRole || userRole !== 'ADMIN') {
    return redirect("/not-admin");
  }

  // Additional security check - ensure user is not banned or has valid permissions
  if (session.user.banned === true) {
    return redirect("/login");
  }

  return session;
});

export const requireAdminOnly = requireStrictAdmin;

