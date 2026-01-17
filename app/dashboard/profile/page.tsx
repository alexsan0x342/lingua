"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Calendar, 
  Award,
  BookOpen,
  Gift,
  Shield,
  Key,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Edit,
  GraduationCap
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useSession } from "@/hooks/use-session";
import { format } from "date-fns";
import { useTranslations } from "@/components/general/I18nProvider";

export default function ProfilePage() {
  const { session, loading: isPending } = useSession();
  const user = session?.user;
  const t = useTranslations();
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    coursesEnrolled: 0,
    coursesCompleted: 0,
    totalProgress: 0,
    user: null as any
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Email verification states
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  
  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Fetch user statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      setIsLoadingStats(true);
      try {
        const response = await fetch("/api/user/profile-stats");
        if (response.ok) {
          const stats = await response.json();
          setProfileData(stats);
        }
      } catch (error) {
        console.error("Failed to fetch profile stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [user]);

  // Handle email verification
  const handleSendVerification = async () => {
    setIsVerifyingEmail(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(t("profile.verificationEmailSent"));
        setShowOtpInput(true);
      } else {
        toast.error(data.error || t("profile.failedToSendVerification"));
      }
    } catch (error) {
      toast.error(t("profile.failedToSendVerification"));
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast.error(t("profile.pleaseEnterCode"));
      return;
    }

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(t("profile.emailVerifiedSuccess"));
        setShowOtpInput(false);
        setOtp("");
        window.location.reload(); // Refresh to update user data
      } else {
        toast.error(data.error || t("profile.invalidVerificationCode"));
      }
    } catch (error) {
      toast.error(t("profile.failedToVerifyEmail"));
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t("profile.fillAllPasswordFields"));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error(t("profile.passwordsDoNotMatch"));
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error(t("profile.passwordTooShort"));
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(t("profile.passwordUpdatedSuccess"));
        setShowPasswordForm(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(data.error || t("profile.failedToUpdatePassword"));
      }
    } catch (error) {
      toast.error(t("profile.failedToUpdatePassword"));
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8" dir="auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 !text-center">{t("profile.myProfile")}</h1>
        <p className="text-gray-600 mt-2 !text-center">{t("profile.manageAccount")}</p>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("profile.profileInformation")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:space-x-6">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 mx-auto sm:mx-0">
              <AvatarImage src="" />
              <AvatarFallback className="text-xl">
                {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2 text-center sm:text-left w-full">
              <h3 className="text-xl font-semibold break-words">{user.name || t("profile.notProvided")}</h3>
              <div className="flex flex-col sm:flex-row items-center gap-2 flex-wrap justify-center sm:justify-start">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground text-sm break-all">{user.email}</span>
                <Badge variant="outline" className="gap-1">
                  <Mail className="h-3 w-3" />
                  {t("profile.emailAccount")}
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 flex-wrap justify-center sm:justify-start">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground text-sm break-words">
                  {t("profile.memberSince")} {profileData.user?.createdAt 
                    ? new Date(profileData.user.createdAt).toLocaleDateString()
                    : new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-center sm:justify-start">
                <Badge variant="outline">{user?.role || profileData.user?.role}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("profile.securitySettings")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Verification */}
          <div>
            <h4 className="font-medium flex items-center gap-2 mb-3">
              <Mail className="h-4 w-4" />
              {t("profile.emailVerification")}
            </h4>
            <div className="space-y-3">
              {(user as any)?.emailVerified ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{t("profile.emailVerified")}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-amber-600">
                    <Mail className="h-4 w-4" />
                    <span>{t("profile.verifyYourEmail")}</span>
                  </div>
                  {!showOtpInput ? (
                    <Button 
                      onClick={handleSendVerification}
                      disabled={isVerifyingEmail}
                      className="gap-2"
                      variant="outline"
                    >
                      {isVerifyingEmail ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                          {t("profile.sending")}
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          {t("profile.sendVerificationEmail")}
                        </>
                      )}
                    </Button>
                  ) : (
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    {t("profile.verificationCodeSent", { email: user?.email })}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("profile.enterVerificationCode")}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                    />
                    <Button onClick={handleVerifyOtp}>{t("profile.verify")}</Button>
                  </div>
                </div>
              )}
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Password Management */}
          <div>
            <h4 className="font-medium flex items-center gap-2 mb-3">
              <Key className="h-4 w-4" />
              {t("profile.passwordManagement")}
            </h4>
            {!showPasswordForm ? (
              <Button 
                onClick={() => setShowPasswordForm(true)}
                variant="outline"
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                {t("profile.changePassword")}
              </Button>
            ) : (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="current-password">{t("profile.currentPassword")}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder={t("profile.enterCurrentPassword")}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value
                      })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">{t("profile.newPassword")}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder={t("profile.enterNewPassword")}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value
                      })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t("profile.confirmNewPassword")}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder={t("profile.confirmPassword")}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value
                    })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handlePasswordChange}>
                    {t("profile.updatePassword")}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("profile.accountInformation")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="break-words">
              <Label className="text-sm font-medium">{t("profile.userId")}</Label>
              <p className="text-sm text-muted-foreground font-mono break-all">{user.id?.slice(-8) || user.id}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">{t("profile.accountStatus")}</Label>
              <Badge variant="outline" className="ml-2">{t("profile.active")}</Badge>
            </div>
            <div className="break-words">
              <Label className="text-sm font-medium">{t("profile.lastLogin")}</Label>
              <p className="text-sm text-muted-foreground break-words">
                {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}