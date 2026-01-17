import { prisma } from "./db";
import { headers } from "next/headers";

interface DeviceInfo {
  userAgent: string;
  ipAddress: string;
  fingerprint: string;
}

interface DeviceSecurityResult {
  isAllowed: boolean;
  isLocked: boolean;
  reason?: string;
  lockUntil?: Date;
}

export class DeviceSecurityManager {
  private static readonly MAX_DEVICES_PER_DAY = 3;
  private static readonly LOCK_DURATION_MINUTES = 30;
  private static readonly SUSPICIOUS_DEVICE_THRESHOLD = 5;

  /**
   * Generate device fingerprint from user agent and other factors
   */
  private static generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
    // Create a simple fingerprint based on user agent and IP
    const combined = `${userAgent}-${ipAddress}`;
    return Buffer.from(combined).toString('base64').slice(0, 32);
  }

  /**
   * Get device info from request headers
   */
  private static async getDeviceInfo(): Promise<DeviceInfo> {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'unknown';
    const ipAddress = headersList.get('x-forwarded-for') || 
                      headersList.get('x-real-ip') || 
                      'unknown';
    
    const fingerprint = this.generateDeviceFingerprint(userAgent, ipAddress);

    return { userAgent, ipAddress, fingerprint };
  }

  /**
   * Check if user should be locked due to device switching
   */
  static async checkDeviceSecurity(userId: string): Promise<DeviceSecurityResult> {
    try {
      // Check if user is currently locked
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          deviceLockUntil: true,
          deviceLockReason: true 
        }
      });

      if (user?.deviceLockUntil && user.deviceLockUntil > new Date()) {
        return {
          isAllowed: false,
          isLocked: true,
          reason: user.deviceLockReason || "Account temporarily locked due to suspicious device activity",
          lockUntil: user.deviceLockUntil
        };
      }

      const deviceInfo = await this.getDeviceInfo();
      
      // Get recent device usage (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentDevices = await prisma.deviceLog.findMany({
        where: {
          userId,
          createdAt: { gte: oneDayAgo }
        },
        select: {
          fingerprint: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Count unique devices in the last 24 hours
      const uniqueDevices = new Set(recentDevices.map(d => d.fingerprint));
      const currentDeviceExists = uniqueDevices.has(deviceInfo.fingerprint);

      // If this is a new device and user has exceeded limit
      if (!currentDeviceExists && uniqueDevices.size >= this.MAX_DEVICES_PER_DAY) {
        // Lock the account
        const lockUntil = new Date(Date.now() + this.LOCK_DURATION_MINUTES * 60 * 1000);
        const lockReason = `Too many different devices used today (${uniqueDevices.size + 1}). Account locked for security.`;

        await prisma.user.update({
          where: { id: userId },
          data: {
            deviceLockUntil: lockUntil,
            deviceLockReason: lockReason
          }
        });

        // Log the security event
        await prisma.securityEvent.create({
          data: {
            userId,
            eventType: 'DEVICE_LIMIT_EXCEEDED',
            description: lockReason,
            ipAddress: deviceInfo.ipAddress,
            userAgent: deviceInfo.userAgent,
            metadata: {
              deviceCount: uniqueDevices.size + 1,
              fingerprint: deviceInfo.fingerprint
            }
          }
        });

        return {
          isAllowed: false,
          isLocked: true,
          reason: lockReason,
          lockUntil
        };
      }

      // Check for rapid device switching (within 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentRapidSwitches = recentDevices.filter(d => 
        d.createdAt > oneHourAgo && d.fingerprint !== deviceInfo.fingerprint
      );

      if (recentRapidSwitches.length >= 2) {
        const lockUntil = new Date(Date.now() + this.LOCK_DURATION_MINUTES * 60 * 1000);
        const lockReason = `Suspicious rapid device switching detected. Account locked for security.`;

        await prisma.user.update({
          where: { id: userId },
          data: {
            deviceLockUntil: lockUntil,
            deviceLockReason: lockReason
          }
        });

        await prisma.securityEvent.create({
          data: {
            userId,
            eventType: 'RAPID_DEVICE_SWITCHING',
            description: lockReason,
            ipAddress: deviceInfo.ipAddress,
            userAgent: deviceInfo.userAgent,
            metadata: {
              rapidSwitches: recentRapidSwitches.length,
              fingerprint: deviceInfo.fingerprint
            }
          }
        });

        return {
          isAllowed: false,
          isLocked: true,
          reason: lockReason,
          lockUntil
        };
      }

      return {
        isAllowed: true,
        isLocked: false
      };

    } catch (error) {
      console.error('Error in device security check:', error);
      // On error, allow access but log the issue
      return {
        isAllowed: true,
        isLocked: false,
        reason: 'Security check failed, access granted'
      };
    }
  }

  /**
   * Log device usage for a user
   */
  static async logDeviceUsage(userId: string): Promise<void> {
    try {
      const deviceInfo = await this.getDeviceInfo();

      // Check if this exact device was used recently (within 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentLog = await prisma.deviceLog.findFirst({
        where: {
          userId,
          fingerprint: deviceInfo.fingerprint,
          createdAt: { gte: fiveMinutesAgo }
        }
      });

      // Only log if not recently logged for this device
      if (!recentLog) {
        await prisma.deviceLog.create({
          data: {
            userId,
            fingerprint: deviceInfo.fingerprint,
            ipAddress: deviceInfo.ipAddress,
            userAgent: deviceInfo.userAgent
          }
        });
      }
    } catch (error) {
      console.error('Error logging device usage:', error);
    }
  }

  /**
   * Unlock user account (admin function)
   */
  static async unlockUser(userId: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          deviceLockUntil: null,
          deviceLockReason: null
        }
      });

      await prisma.securityEvent.create({
        data: {
          userId,
          eventType: 'ACCOUNT_UNLOCKED',
          description: 'Account manually unlocked by admin',
          ipAddress: 'admin',
          userAgent: 'admin'
        }
      });

      return true;
    } catch (error) {
      console.error('Error unlocking user:', error);
      return false;
    }
  }

  /**
   * Get user's device security status
   */
  static async getUserSecurityStatus(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          deviceLockUntil: true,
          deviceLockReason: true
        }
      });

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentDevices = await prisma.deviceLog.findMany({
        where: {
          userId,
          createdAt: { gte: oneDayAgo }
        },
        select: {
          fingerprint: true,
          ipAddress: true,
          createdAt: true
        }
      });

      const uniqueDevices = new Set(recentDevices.map(d => d.fingerprint));

      return {
        isLocked: user?.deviceLockUntil && user.deviceLockUntil > new Date(),
        lockUntil: user?.deviceLockUntil,
        lockReason: user?.deviceLockReason,
        devicesUsedToday: uniqueDevices.size,
        maxDevicesAllowed: this.MAX_DEVICES_PER_DAY
      };
    } catch (error) {
      console.error('Error getting security status:', error);
      return null;
    }
  }
}