import "server-only";
import { prisma } from "@/lib/db";
import { logUserActivity, generateDeviceFingerprint } from "./activity-logger";

/**
 * Enforce single device session - terminates all other sessions when user logs in
 */
export async function enforceSingleDeviceSession(
  userId: string,
  currentSessionToken: string,
  ipAddress: string,
  userAgent: string
): Promise<{ success: boolean; terminatedSessions: number }> {
  try {
    const deviceFingerprint = generateDeviceFingerprint(userAgent, ipAddress);

    // Get all active sessions for this user
    const existingSessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    // Filter out the current session
    const sessionsToTerminate = existingSessions.filter(
      (session) => session.token !== currentSessionToken
    );

    if (sessionsToTerminate.length === 0) {
      return { success: true, terminatedSessions: 0 };
    }

    // Delete all other sessions
    await prisma.session.deleteMany({
      where: {
        id: {
          in: sessionsToTerminate.map((s) => s.id),
        },
      },
    });

    // Log security event for each terminated session
    for (const session of sessionsToTerminate) {
      await logUserActivity({
        userId,
        eventType: 'SESSION_TERMINATED',
        description: `Session terminated due to new device login. Previous device: ${session.userAgent || 'Unknown'}`,
        ipAddress: session.ipAddress || 'unknown',
        userAgent: session.userAgent || 'unknown',
        metadata: {
          terminatedSessionId: session.id,
          newDeviceFingerprint: deviceFingerprint,
          newIpAddress: ipAddress,
        },
      });
    }

    return { success: true, terminatedSessions: sessionsToTerminate.length };
  } catch (error) {
    console.error('Failed to enforce single device session:', error);
    return { success: false, terminatedSessions: 0 };
  }
}

/**
 * Check if user has exceeded device limit (for monitoring purposes)
 */
export async function checkDeviceLimit(
  userId: string,
  maxDevices: number = 1
): Promise<{ exceeded: boolean; activeDevices: number }> {
  try {
    const activeSessions = await prisma.session.count({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    return {
      exceeded: activeSessions > maxDevices,
      activeDevices: activeSessions,
    };
  } catch (error) {
    console.error('Failed to check device limit:', error);
    return { exceeded: false, activeDevices: 0 };
  }
}

/**
 * Get all active sessions for a user
 */
export async function getUserActiveSessions(userId: string) {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        token: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return { success: true, sessions };
  } catch (error) {
    console.error('Failed to get active sessions:', error);
    return { success: false, sessions: [] };
  }
}

/**
 * Manually terminate a specific session
 */
export async function terminateSession(
  sessionId: string,
  userId: string,
  reason: string,
  adminIp: string,
  adminUserAgent: string
): Promise<{ success: boolean }> {
  try {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return { success: false };
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    await logUserActivity({
      userId,
      eventType: 'SESSION_TERMINATED',
      description: `Session manually terminated. Reason: ${reason}`,
      ipAddress: adminIp,
      userAgent: adminUserAgent,
      metadata: {
        terminatedSessionId: sessionId,
        originalIp: session.ipAddress,
        originalUserAgent: session.userAgent,
        reason,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to terminate session:', error);
    return { success: false };
  }
}

/**
 * Lock user out from all devices
 */
export async function lockUserDevices(
  userId: string,
  reason: string,
  lockDurationHours: number = 24
): Promise<{ success: boolean }> {
  try {
    const lockUntil = new Date();
    lockUntil.setHours(lockUntil.getHours() + lockDurationHours);

    // Delete all active sessions
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Set device lock on user
    await prisma.user.update({
      where: { id: userId },
      data: {
        deviceLockUntil: lockUntil,
        deviceLockReason: reason,
      },
    });

    await logUserActivity({
      userId,
      eventType: 'DEVICE_LIMIT_EXCEEDED',
      description: `User locked from all devices. Reason: ${reason}. Lock duration: ${lockDurationHours} hours`,
      ipAddress: 'system',
      userAgent: 'system',
      metadata: {
        lockUntil: lockUntil.toISOString(),
        reason,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to lock user devices:', error);
    return { success: false };
  }
}

/**
 * Check if user is currently locked
 */
export async function isUserDeviceLocked(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        deviceLockUntil: true,
      },
    });

    if (!user || !user.deviceLockUntil) {
      return false;
    }

    return user.deviceLockUntil > new Date();
  } catch (error) {
    console.error('Failed to check device lock:', error);
    return false;
  }
}

/**
 * Unlock user devices
 */
export async function unlockUserDevices(userId: string): Promise<{ success: boolean }> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        deviceLockUntil: null,
        deviceLockReason: null,
      },
    });

    await logUserActivity({
      userId,
      eventType: 'SESSION_TERMINATED',
      description: 'Device lock removed - user unlocked',
      ipAddress: 'system',
      userAgent: 'system',
      metadata: {
        action: 'unlock',
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to unlock user devices:', error);
    return { success: false };
  }
}
