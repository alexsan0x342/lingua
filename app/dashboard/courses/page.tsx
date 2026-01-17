"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Clock,
  PlayCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/components/general/I18nProvider";
import Link from "next/link";
import Image from "next/image";
import { constructUrl } from "@/hooks/use-construct-url";

interface Enrollment {
  id: string;
  createdAt: string;
  Course: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    fileKey?: string;
    _count?: {
      lessons: number;
    };
  };
  progress?: number;
  totalLessons?: number;
}

// Helper to extract plain text from TipTap JSON description
function getPlainTextDescription(description: string | undefined): string {
  if (!description) return "";

  // If it's already plain text (doesn't start with { or [), return as-is
  if (
    !description.trim().startsWith("{") &&
    !description.trim().startsWith("[")
  ) {
    return description;
  }

  try {
    const doc = JSON.parse(description);
    // Extract text from TipTap document structure
    const extractText = (node: any): string => {
      if (typeof node === "string") return node;
      if (node.text) return node.text;
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join("");
      }
      return "";
    };
    return extractText(doc);
  } catch {
    // If parsing fails, return original (truncated if needed)
    return description.length > 100
      ? description.slice(0, 100) + "..."
      : description;
  }
}

export default function MyCoursesPage() {
  const t = useTranslations();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await fetch("/api/user/enrollments");
      if (response.ok) {
        const data = await response.json();
        // API returns { enrollments: [...] }
        const enrollmentsList = Array.isArray(data.enrollments)
          ? data.enrollments
          : Array.isArray(data)
            ? data
            : [];
        setEnrollments(enrollmentsList);
      } else {
        toast.error("Failed to fetch courses");
        setEnrollments([]);
      }
    } catch (error) {
      toast.error("Error fetching courses");
      setEnrollments([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-40 w-full rounded-t-lg" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          {t("navigation.myCourses")}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Continue learning from where you left off
        </p>
      </div>

      {!Array.isArray(enrollments) || enrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Courses Yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              You haven't enrolled in any courses yet. Browse our catalog to
              find courses that interest you.
            </p>
            <Button asChild>
              <Link href="/courses">
                Browse Courses
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(enrollments) &&
            enrollments.map((enrollment) => {
              const course = enrollment.Course;
              const progress = enrollment.progress || 0;
              const lessonCount =
                enrollment.totalLessons || course._count?.lessons || 0;

              return (
                <Card
                  key={enrollment.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-200 group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 bg-muted overflow-hidden">
                    {course.fileKey ? (
                      <Image
                        src={constructUrl(course.fileKey)}
                        alt={course.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/20 to-primary/5">
                        <BookOpen className="h-12 w-12 text-primary/50" />
                      </div>
                    )}

                    {/* Progress overlay */}
                    {progress > 0 && (
                      <div className="absolute top-3 right-3">
                        <Badge
                          variant={progress >= 100 ? "default" : "secondary"}
                          className="gap-1"
                        >
                          {progress >= 100 ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-3 w-3" />
                              {progress}%
                            </>
                          )}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </CardTitle>
                    {course.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {getPlainTextDescription(course.description)}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{lessonCount} lessons</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          Enrolled{" "}
                          {new Date(enrollment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Continue button */}
                    <Button asChild className="w-full">
                      <Link href={`/dashboard/${course.slug}`}>
                        {progress > 0 && progress < 100
                          ? "Continue"
                          : progress >= 100
                            ? "Review"
                            : "Start"}{" "}
                        Course
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
