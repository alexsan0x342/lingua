"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LessonNotFound() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timeout = setTimeout(() => {
      router.push("/admin/courses");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle>Lesson Not Found</CardTitle>
          <CardDescription>
            This lesson may have been deleted or moved. Redirecting you back to courses...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            The lesson you're trying to edit no longer exists. This can happen if:
          </p>
          <ul className="text-sm text-muted-foreground text-left space-y-1">
            <li>• The lesson was deleted by another user</li>
            <li>• The lesson was moved to a different chapter</li>
            <li>• There was an error loading the lesson data</li>
          </ul>
          <div className="pt-4">
            <Button asChild>
              <Link href="/admin/courses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Courses
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

