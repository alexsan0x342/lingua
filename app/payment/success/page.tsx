/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useConfetti } from "@/hooks/use-confetti";
import { ArrowLeft, CheckIcon, Sparkles, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { SuccessAnimation } from "@/components/success-animation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "@/components/general/I18nProvider";

function PaymentSuccessBody() {
  const t = useTranslations();
  const { triggerConfetti } = useConfetti();
  const [showAnimation, setShowAnimation] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [courseTitle, setCourseTitle] = useState('');
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  useEffect(() => {
    // Multiple confetti bursts for extra excitement
    triggerConfetti();
    setTimeout(() => triggerConfetti(), 500);
    setTimeout(() => triggerConfetti(), 1000);
    setTimeout(() => triggerConfetti(), 1500);
    
    // Show success animation
    setShowAnimation(true);
    
    // Create manual enrollment
    if (courseId) {
      createEnrollment();
    } else {
      setEnrollmentStatus('error');
      toast.error(t("toasts.payments.missingCourseInfo"));
    }
  }, [courseId]);

  const createEnrollment = async () => {
    try {
      const response = await fetch('/api/enrollment/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: courseId,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setEnrollmentStatus('success');
        setCourseTitle(data.message || 'Course enrollment successful');
        toast.success(t("toasts.payments.paymentSuccessEnrolled"), {
          duration: 5000,
        });
      } else {
        setEnrollmentStatus('error');
        toast.error(data.error || t("toasts.payments.enrollmentFailed"));
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      setEnrollmentStatus('error');
      toast.error(t("toasts.payments.failedToCompleteEnrollment"));
    }
  };
  
  return (
    <div className="w-full min-h-screen flex flex-1 justify-center items-center relative p-4">
      {showAnimation && (
        <SuccessAnimation 
          isVisible={showAnimation}
          onComplete={() => setShowAnimation(false)}
          title="Payment Complete!"
          message="Welcome to your course!"
        />
      )}
      
      <Card className="w-full max-w-md relative z-10 border-2 border-green-200 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="w-full flex justify-center mb-4">
            <div className="relative">
              <div className="size-16 bg-green-500 text-white rounded-full flex items-center justify-center animate-pulse">
                <CheckIcon className="size-8" />
              </div>
              <Sparkles className="size-6 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="size-5 text-yellow-400 animate-pulse" />
            <h1 className="text-2xl font-bold text-green-600">
              🎉 Payment Successful! 🎉
            </h1>
            <Star className="size-5 text-yellow-400 animate-pulse" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {enrollmentStatus === 'loading' && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Setting up your course access...</span>
            </div>
          )}

          {enrollmentStatus === 'success' && (
            <>
              <div className="text-center space-y-3">
                <p className="text-muted-foreground">
                  🚀 <strong>Congratulations!</strong> Your payment was successful.
                </p>
                <p className="text-sm text-muted-foreground">
                  📚 You now have <strong>lifetime access</strong> to your course!
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                      ✅ Course Unlocked
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300">
                      🎯 Lifetime Support
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}

          {enrollmentStatus === 'error' && (
            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800 text-center">
              <p className="text-sm text-red-800 dark:text-red-200">
                ⚠️ There was an issue setting up your course access. Please contact support.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button 
              asChild 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              disabled={enrollmentStatus === 'loading'}
            >
              <Link href="/dashboard">
                <ArrowLeft className="size-4 mr-2" />
                🎯 Start Learning Now!
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="outline" 
              className="w-full"
            >
              <Link href="/courses">
                Browse More Courses
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessfull() {
  // Wrap the body in Suspense because it uses useSearchParams()
  return (
    <Suspense fallback={<div className="w-full min-h-screen flex items-center justify-center">Loading...</div>}>
      <PaymentSuccessBody />
    </Suspense>
  );
}
