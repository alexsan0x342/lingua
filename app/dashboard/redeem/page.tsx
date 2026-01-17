"use client";

import { CodeRedemption } from "@/components/code-redemption";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Gift } from "lucide-react";
import { useTranslations } from "@/components/general/I18nProvider";

interface CourseInfo {
  id: string;
  title: string;
  description?: string;
  price: number;
}

function RedeemCodeContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course');
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const t = useTranslations();

  useEffect(() => {
    if (courseId) {
      // Fetch course information if courseId is provided
      fetchCourseInfo(courseId);
    }
  }, [courseId]);

  const fetchCourseInfo = async (id: string) => {
    try {
      const response = await fetch(`/api/course/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCourseInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch course info:', error);
    }
  };

  const handleSuccess = (result: any) => {
    // Handle successful redemption
    console.log('Code redeemed:', result);
    if (result.type === 'course') {
      // Redirect to dashboard after successful course redemption
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="container mx-auto py-8" dir="auto">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-center">{t("redeem.title")}</h1>
          <p className="text-muted-foreground text-center">
            {t("redeem.subtitle")}
          </p>
        </div>
        
        {courseInfo && (
          <Card className="mb-6 border-primary/20" dir="auto">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg !text-center">{t("redeem.courseSelected")}</CardTitle>
              </div>
              <CardDescription className="text-center">
                {t("redeem.courseSelectedDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{courseInfo.title}</h3>
                  {courseInfo.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {typeof courseInfo.description === 'string' 
                        ? courseInfo.description.substring(0, 100) + (courseInfo.description.length > 100 ? '...' : '')
                        : 'Course description available'
                      }
                    </p>
                  )}
                </div>
                <Badge variant="secondary">
                  {courseInfo.price} LYD
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
        
        <CodeRedemption onSuccess={handleSuccess} />
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gift className="w-4 h-4" />
            <span className="text-center">{t("redeem.noCode")}</span>
          </div>
          <p className="text-center">{t("redeem.contactSupport")}</p>
        </div>
      </div>
    </div>
  );
}

export default function RedeemCodePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RedeemCodeContent />
    </Suspense>
  );
}
