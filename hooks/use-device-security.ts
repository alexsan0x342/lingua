"use client";

import { useEffect, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/components/general/I18nProvider';

interface DeviceSecurityStatus {
  isLocked: boolean;
  lockUntil?: Date;
  lockReason?: string;
  devicesUsedToday: number;
  maxDevicesAllowed: number;
}

/**
 * Hook to manage device security and account locking
 */
export function useDeviceSecurity() {
  const { session } = useSession();
  const router = useRouter();
  const t = useTranslations();
  const [isChecking, setIsChecking] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockInfo, setLockInfo] = useState<DeviceSecurityStatus | null>(null);

  // Check device security when user session is detected
  useEffect(() => {
    if (session?.user?.id && !isChecking) {
      checkDeviceSecurity();
    }
  }, [session?.user?.id]);

  const checkDeviceSecurity = async () => {
    if (!session?.user?.id || isChecking) return;
    
    setIsChecking(true);
    
    try {
      const response = await fetch('/api/auth/device-security', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.status === 423) {
        // Account is locked
        const data = await response.json();
        setIsLocked(true);
        setLockInfo(data);
        
        toast.error(t("toasts.auth.accountLocked"), {
          description: data.reason || "Too many device switches detected",
          duration: 8000,
        });

        // Redirect to a locked account page or logout
        setTimeout(() => {
          router.push('/auth/locked');
        }, 3000);
        
      } else if (response.ok) {
        setIsLocked(false);
        console.log('✅ Device security check passed');
      } else {
        console.error('❌ Device security check failed');
      }
    } catch (error) {
      console.error('❌ Error checking device security:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const getSecurityStatus = async () => {
    try {
      const response = await fetch('/api/auth/device-security', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setLockInfo(data);
        return data;
      }
    } catch (error) {
      console.error('❌ Error getting security status:', error);
    }
    return null;
  };

  // Periodic security check (every 5 minutes)
  useEffect(() => {
    if (session?.user?.id && !isLocked) {
      const interval = setInterval(() => {
        checkDeviceSecurity();
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [session?.user?.id, isLocked]);

  return {
    isChecking,
    isLocked,
    lockInfo,
    checkDeviceSecurity,
    getSecurityStatus,
  };
}