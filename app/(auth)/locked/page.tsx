"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Shield, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function LockedAccountPage() {
  const router = useRouter();
  const [lockInfo, setLockInfo] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    // Get lock information
    const fetchLockInfo = async () => {
      try {
        const response = await fetch('/api/auth/device-security', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setLockInfo(data);
        }
      } catch (error) {
        console.error('Error fetching lock info:', error);
      }
    };

    fetchLockInfo();
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (!lockInfo?.lockUntil) return;

    const interval = setInterval(() => {
      const now = new Date();
      const lockUntil = new Date(lockInfo.lockUntil);
      const timeDiff = lockUntil.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setTimeRemaining("Account unlocked! You can now try to log in again.");
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor(timeDiff / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [lockInfo]);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-destructive">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">Account Temporarily Locked</CardTitle>
            <CardDescription className="text-center">
              Your account has been temporarily locked for security reasons
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {lockInfo?.lockReason && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Security Alert</p>
                    <p className="text-sm text-muted-foreground">{lockInfo.lockReason}</p>
                  </div>
                </div>
              </div>
            )}

            {timeRemaining && (
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Time remaining:</span>
                </div>
                <div className="text-2xl font-mono font-bold text-primary">
                  {timeRemaining}
                </div>
              </div>
            )}

            {lockInfo && (
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">Devices used today:</span>{" "}
                  <span className="text-muted-foreground">
                    {lockInfo.devicesUsedToday}/{lockInfo.maxDevicesAllowed}
                  </span>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Security Tips:
                  </p>
                  <ul className="text-blue-800 dark:text-blue-200 space-y-1 text-xs">
                    <li>• Use the same device for consistent access</li>
                    <li>• Avoid switching between multiple devices rapidly</li>
                    <li>• Contact support if you need to use multiple devices</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/">
            <Button variant="ghost" size="sm">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}