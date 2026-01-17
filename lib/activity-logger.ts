import "server-only";
import { prisma } from "@/lib/db";

export type ActivityEventType = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'EMAIL_CODE_SENT' 
  | 'EMAIL_VERIFIED'
  | 'EMAIL_CHANGED' 
  | 'PASSWORD_CHANGED'
  | 'SESSION_TERMINATED'
  | 'DEVICE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY';

interface LogActivityParams {
  userId: string;
  eventType: ActivityEventType;
  description: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

/**
 * Log user activity to the database for audit trail
 */
export async function logUserActivity(params: LogActivityParams) {
  const { userId, eventType, description, ipAddress, userAgent, metadata } = params;

  try {
    // Log to SecurityEvent table
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType,
        description,
        ipAddress,
        userAgent,
        metadata: metadata || {},
      },
    });

    // For login events, also log to DeviceLog
    if (eventType === 'LOGIN') {
      const fingerprint = generateDeviceFingerprint(userAgent, ipAddress);
      
      await prisma.deviceLog.create({
        data: {
          userId,
          fingerprint,
          ipAddress,
          userAgent,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to log user activity:', error);
    return { success: false, error };
  }
}

/**
 * Generate a simple device fingerprint from user agent and IP
 */
export function generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
  // Simple fingerprint - in production you might want to use a more sophisticated method
  const combined = `${userAgent}|${ipAddress}`;
  
  // Create a simple hash
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Get recent activity for a user
 */
export async function getUserActivity(userId: string, limit: number = 50) {
  try {
    const activities = await prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return { success: true, activities };
  } catch (error) {
    console.error('Failed to get user activity:', error);
    return { success: false, error, activities: [] };
  }
}

/**
 * Get device login history for a user
 */
export async function getUserDeviceHistory(userId: string, limit: number = 100) {
  try {
    const devices = await prisma.deviceLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return { success: true, devices };
  } catch (error) {
    console.error('Failed to get device history:', error);
    return { success: false, error, devices: [] };
  }
}

/**
 * Clean up old activity logs (run as a cron job)
 */
export async function cleanupOldActivityLogs(daysToKeep: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  try {
    const [deletedSecurityEvents, deletedDeviceLogs] = await Promise.all([
      prisma.securityEvent.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      }),
      prisma.deviceLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      }),
    ]);

    return {
      success: true,
      deletedSecurityEvents: deletedSecurityEvents.count,
      deletedDeviceLogs: deletedDeviceLogs.count,
    };
  } catch (error) {
    console.error('Failed to cleanup old activity logs:', error);
    return { success: false, error };
  }
}
