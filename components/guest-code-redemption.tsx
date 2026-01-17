"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, CheckCircle, Loader2, User, Mail } from "lucide-react";
import { toast } from "sonner";
import { generateDeviceId } from "@/lib/device-tracking-client";
import { SuccessAnimation } from "@/components/success-animation";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "@/components/general/I18nProvider";

interface GuestCodeRedemptionProps {
  onSuccess?: (result: any) => void;
  compact?: boolean;
}

export function GuestCodeRedemption({ onSuccess, compact = false }: GuestCodeRedemptionProps) {
  const t = useTranslations();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  const { data: session } = authClient.useSession();
  const isGuest = !session;

  useEffect(() => {
    // Generate device ID when component mounts
    try {
      const id = generateDeviceId();
      console.log("Generated device ID:", id);
      setDeviceId(id);
    } catch (error) {
      console.error("Failed to generate device ID:", error);
      // Fallback device ID
      setDeviceId(`fallback-${Date.now()}-${Math.random().toString(36).substring(2)}`);
    }
  }, []);

  const redeemCode = async () => {
    console.log("Redeem code called with:", { 
      code: code.trim(), 
      deviceId, 
      isGuest,
      hasEmail: !!email,
      hasName: !!name 
    });
    
    if (!code.trim()) {
      toast.error(t("toasts.codes.pleaseEnterCode"));
      return;
    }

    if (!deviceId) {
      toast.error("Device ID not generated. Please refresh the page.");
      return;
    }

    if (isGuest && (!email.trim() || !name.trim())) {
      toast.error(t("toasts.codes.pleaseProvideEmailAndName"));
      return;
    }

    setLoading(true);

    try {
      const endpoint = isGuest ? '/api/redeem-code/guest' : '/api/redeem-code';
      const requestBody = {
        code: code.trim(),
        deviceId: deviceId,
        ...(isGuest && { email: email.trim(), name: name.trim() })
      };

      console.log("Making API call to:", endpoint, "with body:", requestBody);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("API response:", { status: response.status, data });

      if (response.ok) {
        setResult(data);
        setShowSuccessAnimation(true);
        
        if (isGuest && data.loginUrl) {
          toast.success(
            `🎉 Code redeemed successfully! Check your email for login instructions.`,
            { duration: 6000 }
          );
        } else {
          toast.success(t("toasts.codes.enrolledSuccess"));
        }
        
        if (onSuccess) {
          onSuccess(data);
        }
        
        // Reset form
        setCode("");
        if (isGuest) {
          setEmail("");
          setName("");
        }
      } else {
        toast.error(data.error || t("toasts.codes.failedToRedeem"));
      }
    } catch (error) {
      console.error('Code redemption error:', error);
      toast.error(t("toasts.codes.errorRedeemingCode"));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      redeemCode();
    }
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {isGuest && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-center"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-center"
                disabled={loading}
              />
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter access code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            className="text-center font-mono tracking-wide"
            disabled={loading}
          />
          <Button 
            onClick={redeemCode} 
            disabled={loading || !code.trim() || (isGuest && (!email.trim() || !name.trim()))}
            size="default"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Gift className="w-4 h-4" />
            )}
          </Button>
        </div>

        {result && (
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-200">
              <CheckCircle className="w-4 h-4" />
              Successfully enrolled in {result.course.title}!
            </div>
            {result.isGuest && (
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Check your email for login instructions.
              </p>
            )}
          </div>
        )}

        <SuccessAnimation
          isVisible={showSuccessAnimation}
          onComplete={() => setShowSuccessAnimation(false)}
          title="Code Redeemed!"
          message={result ? `Welcome to ${result.course.title}!` : ""}
        />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="w-6 h-6 text-white" />
        </div>
        <CardTitle>Redeem Access Code</CardTitle>
        <CardDescription>
          {isGuest 
            ? "Enter your details and access code to unlock your course"
            : "Enter your access code to unlock a course"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isGuest && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Your Name
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Your Email
              </label>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                required
              />
            </div>
          </>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Access Code
          </label>
          <Input
            type="text"
            placeholder="Enter your access code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            className="text-center font-mono tracking-wide text-lg"
            disabled={loading}
          />
        </div>

        <Button 
          onClick={redeemCode} 
          disabled={loading || !code.trim() || (isGuest && (!email.trim() || !name.trim()))}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redeeming...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Redeem Code
            </div>
          )}
        </Button>

        {result && (
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              <CheckCircle className="w-4 h-4" />
              Code Redeemed Successfully!
            </div>
            <div className="space-y-1">
              <p className="text-sm text-green-700 dark:text-green-300">
                <strong>Course:</strong> {result.course.title}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                <strong>Level:</strong> {result.course.level} • <strong>Duration:</strong> {result.course.duration}h
              </p>
              {result.isGuest && (
                <p className="text-xs text-green-700 dark:text-green-300 mt-2 p-2 bg-green-100 dark:bg-green-900 rounded">
                  📧 Check your email for login instructions to access your course.
                </p>
              )}
            </div>
          </div>
        )}

        <SuccessAnimation
          isVisible={showSuccessAnimation}
          onComplete={() => setShowSuccessAnimation(false)}
          title="🎉 Code Redeemed!"
          message={result ? `Welcome to ${result.course.title}!` : "Access unlocked!"}
        />
      </CardContent>
    </Card>
  );
}