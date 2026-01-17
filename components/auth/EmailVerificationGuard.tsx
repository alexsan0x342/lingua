"use client";

import { useEffect } from "react";
import { useSession } from "@/hooks/use-session";
import { useRouter, usePathname } from "next/navigation";

const EXEMPT_ROUTES = ['/settings', '/logout', '/verify-email', '/api'];

export function EmailVerificationGuard({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in
    if (!session?.user) return;

    // Check if route is exempt
    const isExempt = EXEMPT_ROUTES.some(route => pathname.startsWith(route));
    if (isExempt) return;

    // Check if email is verified
    const emailVerified = (session.user as any)?.emailVerified;
    
    if (!emailVerified) {
      router.push('/verify-email');
    }
  }, [session, pathname, router]);

  return <>{children}</>;
}
