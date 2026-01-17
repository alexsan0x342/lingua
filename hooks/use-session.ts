"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

interface SessionData {
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string | null;
    banned?: boolean | null;
    emailVerified?: boolean;
  };
}

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  const getSession = async () => {
    try {
      const sessionData = await authClient.getSession();
      setSession(sessionData.data);
    } catch (error) {
      console.error('Failed to get session:', error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    setLoading(true);
    await getSession();
  };

  useEffect(() => {
    getSession();
  }, []);

  return { session, loading, refreshSession };
}
