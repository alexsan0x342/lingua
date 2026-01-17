"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from '@/components/general/I18nProvider';

export function useSignOut() {
  const router = useRouter();
  const t = useTranslations();
  const handleSignout = async function signOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/"); // redirect to login page
          toast.success(t("toasts.auth.signedOutSuccess"));
        },
        onError: () => {
          toast.error(t("toasts.auth.failedToSignOut"));
        },
      },
    });
  };

  return handleSignout;
}
