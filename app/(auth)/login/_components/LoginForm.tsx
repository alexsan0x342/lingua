"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useTranslations, useLocale } from "@/components/general/I18nProvider";

import { Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [passwordPending, startPasswordTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleOAuthConfigured, setIsGoogleOAuthConfigured] = useState(false);

  useEffect(() => {
    // Check if Google OAuth is configured
    fetch('/api/auth/providers')
      .then(res => res.json())
      .then(data => {
        setIsGoogleOAuthConfigured(!!data.google);
      })
      .catch(() => {
        // For development, show Google button even if API fails
        setIsGoogleOAuthConfigured(true);
      });
  }, []);

  function signInWithPassword() {
    if (!email || !password) {
      toast.error(t("auth.pleaseEnterEmailPassword"));
      return;
    }
    startPasswordTransition(async () => {
      await authClient.signIn.email({
        email,
        password,
        fetchOptions: {
          onSuccess: () => {
            toast.success(t("auth.loggedInSuccessfully"));
            // Use window.location for full page reload to refresh auth state
            window.location.href = "/dashboard";
          },
          onRequest: (context) => {
            //show loading
            return context;
          },
          onResponse: (context) => {
            return context;
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || t("auth.failedToLogin"));
          },
        },
      });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {isGoogleOAuthConfigured && (
        <Button 
          onClick={() => authClient.signIn.social({ provider: "google" })}
          variant="outline" 
          className="w-full"
        >
          <svg className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t("auth.continueWithGoogle")}
        </Button>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t("auth.orContinueWith")}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <div className="relative">
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.passwordPlaceholder")}
              required
              className={isRtl ? 'pl-10' : 'pr-10'}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-0 h-full px-3 py-2 hover:bg-transparent`}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <Button onClick={signInWithPassword} disabled={passwordPending} className="w-full">
          {passwordPending ? (
            <>
              <Loader2 className={`size-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />
              <span>{t("auth.signingIn")}</span>
            </>
          ) : (
            <>
              <KeyRound className={`size-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              <span>{t("auth.signInWithPassword")}</span>
            </>
          )}
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        {t("auth.dontHaveAccount")}{" "}
        <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
          {t("auth.signup")}
        </Link>
      </div>
    </div>
  );
}
