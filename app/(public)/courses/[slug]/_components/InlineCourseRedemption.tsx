"use client";

import { CodeRedemption } from "@/components/code-redemption";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift } from "lucide-react";

interface InlineCourseRedemptionProps {
  courseId: string;
  courseTitle: string;
}

export function InlineCourseRedemption({ courseId, courseTitle }: InlineCourseRedemptionProps) {
  const handleSuccess = (result: any) => {
    if (result.type === 'course') {
      // Refresh the page to show the enrolled state
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">🎬 Showcase Mode - Access via Code</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Enter your access code to unlock "{courseTitle}"
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <CodeRedemption onSuccess={handleSuccess} compact={true} />
        </CardContent>
      </Card>
      
      <p className="text-center text-xs text-muted-foreground bg-muted/50 p-2 rounded">
        📚 This is a demo platform - Course access is provided through access codes only
      </p>
    </div>
  );
}