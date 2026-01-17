"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateDeviceId } from "@/lib/device-tracking-client";
import { SuccessAnimation } from "@/components/success-animation";
import { useTranslations } from "@/components/general/I18nProvider";
import { useSession } from "@/hooks/use-session";
import { useRouter } from "next/navigation";

interface CodeRedemptionProps {
  onSuccess?: (result: any) => void;
  compact?: boolean;
}

export function CodeRedemption({ onSuccess, compact = false }: CodeRedemptionProps) {
  const t = useTranslations();
  const { session, loading: sessionLoading } = useSession();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

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
    console.log("Redeem code called with:", { code: code.trim(), deviceId });
    
    // Check if user is logged in
    if (!session?.user) {
      toast.error(t("redemptionCodes.pleaseLoginToRedeem"));
      router.push("/login");
      return;
    }
    
    if (!code.trim()) {
      toast.error(t("redemptionCodes.enterCode"));
      return;
    }

    if (!deviceId) {
      toast.error(t("errors.deviceIdError"));
      return;
    }

    try {
      setLoading(true);
      console.log("Making API call to /api/redeem-code");
      
      const response = await fetch("/api/redeem-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim(), deviceId }),
      });

      console.log("API response status:", response.status);
      const data = await response.json();
      console.log("API response data:", data);

      if (response.ok) {
        setResult(data);
        setShowSuccessAnimation(true);
        setCode("");
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        console.error("Redeem code error:", data);
        toast.error(data.error || t("redemptionCodes.failedToRedeem"));
        setResult(null);
      }
    } catch (error) {
      console.error("Failed to redeem code:", error);
      toast.error(t("errors.unexpectedError"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      redeemCode();
    }
  };

  const getSuccessMessage = () => {
    if (result?.type === "course") {
      return `${t("redemptionCodes.courseAccess")} ${result.course?.title}`;
    } else if (result?.type === "discount") {
      return t("redemptionCodes.discountApplied");
    } else if (result?.type === "service") {
      return `${t("redemptionCodes.serviceGranted")} ${result.serviceType}`;
    }
    return t("redemptionCodes.redeemSuccess");
  };

  if (compact) {
    // Compact mode - just the form without card wrapper
    return (
      <>
        <div className="space-y-3">
          <div className="space-y-2">
            <Input
              placeholder={t("redeem.enterCode")}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="text-center font-mono tracking-wider"
            />
            <Button
              onClick={redeemCode}
              disabled={loading || !code.trim()}
              className="w-full"
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("redeem.redeeming")}
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  {t("redeem.redeemButton")}
                </>
              )}
            </Button>
          </div>

          {result && (
            <div className="space-y-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">{t("success.success")}</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">{result.message}</p>
            </div>
          )}
        </div>

        {/* Success Animation for compact mode */}
        {showSuccessAnimation && (
          <SuccessAnimation 
            isVisible={showSuccessAnimation}
            onComplete={() => setShowSuccessAnimation(false)}
            title={t("redeem.codeRedeemed")}
            message={getSuccessMessage()}
            type="redemption"
          />
        )}
      </>
    );
  }

  // Full mode - original card layout
  return (
    <>
      <Card className="w-full max-w-md mx-auto" dir="auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="!text-center">{t("redeem.redeemButton")}</CardTitle>
          <CardDescription className="text-center">
            {t("redeem.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder={t("redeem.enterCode")}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="text-center font-mono text-lg tracking-wider"
            />
            <Button
              onClick={redeemCode}
              disabled={loading || !code.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("redeem.redeeming")}
                </>
              ) : (
                t("redeem.redeemButton")
              )}
            </Button>
          </div>

          {result && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium text-green-700">{t("success.success")}</span>
              </div>
              
              {result.type === "course" && (
                <div className="space-y-2">
                  <Badge variant="secondary" className="w-fit">
                    {t("redeem.courseAccess")}
                  </Badge>
                  <p className="text-sm">{result.message}</p>
                  <div className="text-xs text-muted-foreground">
                    {t("redemptionCodes.courseAccess")} <strong>{result.course?.title}</strong>
                  </div>
                </div>
              )}

              {result.type === "discount" && (
                <div className="space-y-2">
                  <Badge variant="default" className="w-fit">
                    {t("redeem.discountApplied")}
                  </Badge>
                  <p className="text-sm">{result.message}</p>
                  <div className="text-xs text-muted-foreground">
                    {t("redeem.discountValue")}: <strong>${result.discountValue / 100}</strong>
                  </div>
                </div>
              )}

              {result.type === "service" && (
                <div className="space-y-2">
                  <Badge variant="outline" className="w-fit">
                    {t("redeem.serviceAccess")}
                  </Badge>
                  <p className="text-sm">{result.message}</p>
                  <div className="text-xs text-muted-foreground">
                    {t("redeem.service")}: <strong>{result.serviceType}</strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Animation for full mode */}
      {showSuccessAnimation && (
        <SuccessAnimation
          isVisible={showSuccessAnimation}
          onComplete={() => setShowSuccessAnimation(false)}
          title={t("redeem.codeRedeemed")}
          message={getSuccessMessage()}
          type="redemption"
        />
      )}
    </>
  );
}