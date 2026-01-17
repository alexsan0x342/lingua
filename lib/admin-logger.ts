import "server-only";
import { prisma } from "./db";

interface LogAdminActionParams {
  adminId: string;
  adminEmail: string;
  adminName?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an admin action to the database
 * This tracks what admins are doing in the system
 * NOTE: Disabled - AdminLog model needs to be added to schema
 */
export async function logAdminAction(params: LogAdminActionParams) {
  // TODO: Add AdminLog model to Prisma schema before enabling
  return;

  /*
  try {
    await prisma.adminLog.create({
      data: {
        adminId: params.adminId,
        adminEmail: params.adminEmail,
        adminName: params.adminName || null,
        action: params.action,
        resourceType: params.resourceType || null,
        resourceId: params.resourceId || null,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    // Silent fail - we don't want logging to break the app
  }
  */
}

/**
 * Check if a user is the super admin (can view logs)
 */
export function isSuperAdmin(email: string): boolean {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!superAdminEmail) {
    return false;
  }
  return email.toLowerCase() === superAdminEmail.toLowerCase();
}
