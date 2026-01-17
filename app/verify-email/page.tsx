"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Send, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "@/components/general/I18nProvider";

export default function VerifyEmailPage() {
  const t = useTranslations();
  const { session, refreshSession } = useSession();
  const router = useRouter();
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already verified, redirect to dashboard
  if ((session?.user as any)?.emailVerified) {
    router.push("/dashboard");
    return null;
  }

  const sendVerificationEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        toast.success(t('toasts.auth.verificationEmailSent'));
        setVerificationEmailSent(true);
      } else {
        toast.error(data.error || t('toasts.auth.failedToSendVerificationEmail'));
      }
    } catch (error) {
      toast.error(t('toasts.auth.failedToSendVerificationEmail'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    const codeInput = document.getElementById('verification-code') as HTMLInputElement;
    const code = codeInput?.value;
    
    if (!code || code.length !== 6) {
      toast.error(t('toasts.auth.pleaseEnterValidCode'));
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: code })
      });
      const data = await response.json();
      
      if (response.ok) {
        toast.success(t('toasts.auth.emailVerifiedSuccess'));
        await refreshSession();
        router.push('/dashboard');
      } else {
        toast.error(data.error || t('toasts.auth.invalidVerificationCode'));
      }
    } catch (error) {
      toast.error(t('toasts.auth.failedToVerifyEmail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-4">
        <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <Card>
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription>
              Please verify your email address to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
              <p className="text-sm text-center">
                A verification code will be sent to:<br />
                <span className="font-medium">{session?.user?.email}</span>
              </p>

              {!verificationEmailSent ? (
                <Button 
                  onClick={sendVerificationEmail}
                  className="w-full"
                  disabled={loading}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? "Sending..." : "Send Verification Code"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="verification-code" className="text-sm">
                      Enter 6-Digit Code
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={sendVerificationEmail}
                      disabled={loading}
                    >
                      Resend Code
                    </Button>
                  </div>
                  
                  <Input
                    id="verification-code"
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        verifyCode();
                      }
                    }}
                  />
                  
                  <Button 
                    onClick={verifyCode}
                    className="w-full"
                    disabled={loading}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {loading ? "Verifying..." : "Verify Email"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Didn't receive the code? Check your spam folder or click resend.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
