"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useTranslations, useLocale } from "@/components/general/I18nProvider";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { Eye, EyeOff, Loader2, UserPlus, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";

type SignupStep = "form" | "otp";

export function SignupForm() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<SignupStep>("form");
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleOAuthConfigured, setIsGoogleOAuthConfigured] = useState(false);

  useEffect(() => {
    // Check if Google OAuth is configured
    fetch('/api/auth/providers')
      .then(res => res.json())
      .then(data => {
        setIsGoogleOAuthConfigured(!!data.google);
      })
      .catch(() => {
        setIsGoogleOAuthConfigured(true);
      });
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Step 1: Validate form and send OTP
  function handleSendOTP() {
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      toast.error(t("auth.pleaseFillAllFields"));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t("auth.passwordsDoNotMatch"));
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t("auth.passwordMinLength"));
      return;
    }

    startTransition(async () => {
      try {
        // Send OTP to email
        const { error } = await authClient.emailOtp.sendVerificationOtp({
          email: formData.email.trim(),
          type: "email-verification",
        });

        if (error) {
          toast.error(error.message || t("auth.failedToSendOTP") || "Failed to send verification code");
          return;
        }

        toast.success(t("auth.otpSent") || "Verification code sent to your email");
        setStep("otp");
      } catch (error: any) {
        toast.error(error.message || t("auth.failedToSendOTP") || "Failed to send verification code");
      }
    });
  }

  // Step 2: Verify OTP and complete signup
  function handleVerifyOTP() {
    if (otp.length !== 6) {
      toast.error(t("auth.pleaseEnterOTP") || "Please enter the 6-digit code");
      return;
    }

    startTransition(async () => {
      try {
        // Create account
        const { data, error } = await authClient.signUp.email({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        });

        if (error) {
          toast.error(error.message || t("auth.failedToCreateAccount"));
          return;
        }

        // Verify the OTP
        const verifyResult = await authClient.emailOtp.verifyEmail({
          email: formData.email.trim(),
          otp: otp,
        });

        if (verifyResult.error) {
          toast.error(verifyResult.error.message || t("auth.invalidOTP") || "Invalid verification code");
          return;
        }

        // Update emailVerified field in database
        try {
          await fetch('/api/auth/set-email-verified', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (err) {
          console.error('Failed to set email verified:', err);
        }

        toast.success(t("auth.accountCreatedSuccessfully"));
        // Use window.location for full page reload to refresh auth state
        window.location.href = "/dashboard";
      } catch (error: any) {
        toast.error(error.message || t("auth.failedToCreateAccount"));
      }
    });
  }

  // Resend OTP
  function handleResendOTP() {
    startTransition(async () => {
      try {
        const { error } = await authClient.emailOtp.sendVerificationOtp({
          email: formData.email.trim(),
          type: "email-verification",
        });

        if (error) {
          toast.error(error.message || "Failed to resend code");
          return;
        }

        toast.success(t("auth.otpResent") || "New code sent to your email");
        setOtp("");
      } catch (error: any) {
        toast.error(error.message || "Failed to resend code");
      }
    });
  }

  // OTP Verification Step
  if (step === "otp") {
    return (
      <div className="flex flex-col gap-6">
        <Button 
          variant="ghost" 
          onClick={() => setStep("form")}
          className="w-fit -ml-2"
        >
          <ArrowLeft className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          {t("common.back") || "Back"}
        </Button>

        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">{t("auth.verifyEmail") || "Verify your email"}</h3>
          <p className="text-sm text-muted-foreground">
            {t("auth.otpSentTo") || "We sent a verification code to"}{" "}
            <span className="font-medium text-foreground">{formData.email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button 
            onClick={handleVerifyOTP} 
            disabled={pending || otp.length !== 6} 
            className="w-full"
          >
            {pending ? (
              <>
                <Loader2 className={`size-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />
                <span>{t("auth.verifying") || "Verifying..."}</span>
              </>
            ) : (
              <span>{t("auth.verifyAndCreateAccount") || "Verify & Create Account"}</span>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {t("auth.didntReceiveCode") || "Didn't receive the code?"}{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto"
              onClick={handleResendOTP}
              disabled={pending}
            >
              {t("auth.resendCode") || "Resend"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form Step
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
          <Label htmlFor="name">{t("auth.fullName")}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            type="text"
            placeholder={t("auth.fullNamePlaceholder")}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
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
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.createPasswordPlaceholder")}
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
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t("auth.confirmPasswordPlaceholder")}
              required
              className={isRtl ? 'pl-10' : 'pr-10'}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-0 h-full px-3 py-2 hover:bg-transparent`}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <Button onClick={handleSendOTP} disabled={pending} className="w-full">
          {pending ? (
            <>
              <Loader2 className={`size-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />
              <span>{t("auth.sendingCode") || "Sending code..."}</span>
            </>
          ) : (
            <>
              <UserPlus className={`size-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              <span>{t("auth.continueWithEmail") || "Continue"}</span>
            </>
          )}
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        {t("auth.alreadyHaveAccount")}{" "}
        <Link href="/login" className="underline underline-offset-4 hover:text-primary">
          {t("auth.signIn")}
        </Link>
      </div>
    </div>
  );
}