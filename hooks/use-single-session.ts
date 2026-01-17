import { useEffect, useState } from 'react';
import { useSession } from '@/hooks/use-session';

/**
 * Hook to enforce single session per user
 * Automatically cleans up other sessions when user logs in
 */
export function useSingleSession() {
  const { session } = useSession();
  const [isEnforcing, setIsEnforcing] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{
    activeSessionCount: number;
    sessionId: string | null;
  } | null>(null);

  // Enforce single session when user session is detected
  useEffect(() => {
    if (session?.user?.id && !isEnforcing) {
      enforceSingleSession();
    }
  }, [session?.user?.id]);

  const enforceSingleSession = async () => {
    if (!session?.user?.id) return;
    
    setIsEnforcing(true);
    
    try {
      const response = await fetch('/api/auth/session-cleanup', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Single session enforced:', data);
        
        // Get updated session info
        await getSessionInfo();
      } else {
        console.error('❌ Failed to enforce single session');
      }
    } catch (error) {
      console.error('❌ Error enforcing single session:', error);
    } finally {
      setIsEnforcing(false);
    }
  };

  const getSessionInfo = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('/api/auth/session-cleanup', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setSessionInfo({
          activeSessionCount: data.activeSessionCount,
          sessionId: data.sessionId,
        });
      } else {
        console.warn('⚠️ Session info request failed:', response.status, response.statusText);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn('⚠️ Session info request timed out');
        } else if (error.message.includes('fetch')) {
          console.warn('⚠️ Network error getting session info - server may be down');
        } else {
          console.error('❌ Error getting session info:', error.message);
        }
      } else {
        console.error('❌ Unknown error getting session info:', error);
      }
      // Don't fail silently - this is expected behavior for network issues
      // The session will still work, just without session count info
    }
  };

  // Check session info periodically
  useEffect(() => {
    if (session?.user?.id) {
      getSessionInfo();
      
      // Check every 30 seconds
      const interval = setInterval(getSessionInfo, 30000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.id]);

  return {
    isEnforcing,
    sessionInfo,
    enforceSingleSession,
    getSessionInfo,
  };
}