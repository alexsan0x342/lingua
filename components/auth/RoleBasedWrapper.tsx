import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { UserRole } from "@/lib/rbac";
import { headers } from "next/headers";

interface RoleBasedWrapperProps {
  children: ReactNode;
  requiredPermission?: (role: UserRole | null) => boolean;
  fallback?: ReactNode;
}

export async function RoleBasedWrapper({ 
  children, 
  requiredPermission,
  fallback = <div>Access denied</div>
}: RoleBasedWrapperProps) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return <div>Please log in</div>;
    }

    const userRole = session.user.role as UserRole | null;

    if (requiredPermission && !requiredPermission(userRole)) {
      return fallback;
    }

    return <>{children}</>;
  } catch (error) {
    console.error('RoleBasedWrapper error:', error);
    return <div>Authentication error</div>;
  }
}
