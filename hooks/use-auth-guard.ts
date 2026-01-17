"use client";

import { useEffect } from 'react';
import { useSession } from '@/hooks/use-session';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from '@/components/general/I18nProvider';

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireAdmin?: boolean;
  showToast?: boolean;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { session, loading } = useSession();
  const router = useRouter();
  const t = useTranslations();

  const {
    redirectTo = '/login',
    requireAdmin = false,
    showToast = true
  } = options;

  useEffect(() => {
    if (loading) return;

    // Check if user is authenticated
    if (!session?.user?.id) {
      if (showToast) {
        toast.error(t("toasts.auth.pleaseLoginToAccess"));
      }
      router.push(redirectTo);
      return;
    }

    // Check admin requirements (ADMIN and MANAGER roles)
    if (requireAdmin && !['ADMIN', 'MANAGER'].includes(session.user.role || '')) {
      if (showToast) {
        toast.error(t("toasts.auth.noPermission"));
      }
      router.push('/not-admin');
      return;
    }

    // Check if user is banned
    if (session.user.banned === true) {
      if (showToast) {
        toast.error(t("toasts.auth.accountSuspended"));
      }
      router.push('/login');
      return;
    }
  }, [session, loading, router, redirectTo, requireAdmin, showToast, t]);

  return {
    isAuthenticated: !!session?.user?.id,
    isAdmin: ['ADMIN', 'MANAGER'].includes(session?.user?.role || ''),
    isBanned: session?.user?.banned === true,
    isLoading: loading,
    user: session?.user
  };
}

// Specific hooks for common use cases
export function useRequireAuth(redirectTo?: string) {
  return useAuthGuard({ redirectTo });
}

export function useRequireAdmin() {
  return useAuthGuard({ 
    requireAdmin: true, 
    redirectTo: '/not-admin',
    showToast: true 
  });
}

// Deprecated: TEACHER role no longer exists, use useRequireAdmin instead
export function useRequireTeacher() {
  console.warn('useRequireTeacher is deprecated: TEACHER role no longer exists. Use useRequireAdmin instead.');
  return useAuthGuard({ 
    requireAdmin: true,
    redirectTo: '/not-admin',
    showToast: true 
  });
}