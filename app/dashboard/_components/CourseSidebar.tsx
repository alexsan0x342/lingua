"use client";

import { CourseSidebarDataType } from "@/app/data/course/get-course-sidebar-data";
import { Button } from "@/components/ui/button";
import {
  CollapsibleContent,
  Collapsible,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Play, Video, CheckCircle } from "lucide-react";
import { LessonItem } from "./LessonItem";
import { usePathname } from "next/navigation";
import { useCourseProgress } from "@/hooks/use-course-progress";
import Link from "next/link";
import { useTranslations, useLocale } from "@/components/general/I18nProvider";

interface iAppProps {
  course: CourseSidebarDataType["course"];
}

export function CourseSidebar({ course }: iAppProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const currentLessonId = pathname.split("/").pop();

  const { completedLessons, totalLessons, progressPercentage } =
    useCourseProgress({ courseData: course });

  // Get category name based on locale
  const getCategoryName = () => {
    if (course.courseCategory) {
      return locale === "ar" && course.courseCategory.nameAr 
        ? course.courseCategory.nameAr 
        : course.courseCategory.name;
    }
    return course.category;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 lg:pb-4 lg:pr-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-12 lg:size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Play className="size-6 lg:size-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-lg lg:text-base leading-tight truncate">
              {course.title}
            </h1>
            <p className="text-sm lg:text-xs text-muted-foreground mt-1 truncate">
              {getCategoryName()}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm lg:text-xs">
            <span className="text-muted-foreground">{t("dashboard.progress")}</span>
            <span className="font-medium">
              {completedLessons}/{totalLessons} {t("courses.lessons")}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2 lg:h-1.5" />
          <p className="text-sm lg:text-xs text-muted-foreground">
            {progressPercentage}% {t("courses.complete")}
          </p>
          
          {/* Show Course Completed badge when all lessons are finished */}
          {progressPercentage === 100 && (
            <div className="pt-2">
              <Badge className="w-full justify-center py-2 bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20">
                <CheckCircle className="size-4 mr-2" />
                {t("courses.courseCompleted")}
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 lg:py-4 lg:pr-4 space-y-4">
        {/* Course Recordings Section */}
        <div className="mb-4">
          <Link href={`/dashboard/${course.slug}/recordings`}>
            <Button
              variant="outline"
              className="w-full p-4 lg:p-3 h-auto flex items-center gap-3 lg:gap-2 hover:bg-primary/5"
            >
              <div className="shrink-0">
                <Video className="size-5 lg:size-4 text-primary" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-base lg:text-sm truncate text-foreground">
                  {t("courses.courseRecordings")}
                </p>
                <p className="text-xs lg:text-[10px] text-muted-foreground font-medium truncate">
                  {t("courses.liveLessonRecordings")}
                </p>
              </div>
            </Button>
          </Link>
        </div>

        {/* Course Chapters */}
        {course.chapter.map((chapter, index) => (
          <Collapsible key={chapter.id} defaultOpen={index === 0}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full p-4 lg:p-3 h-auto flex items-center gap-3 lg:gap-2"
              >
                <div className="shrink-0">
                  <ChevronDown className="size-5 lg:size-4 text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-base lg:text-sm truncate text-foreground">
                    {chapter.title}
                  </p>

                  <p className="text-xs lg:text-[10px] text-muted-foreground font-medium truncate">
                    {chapter.lessons.length} {t("courses.lessons")}
                  </p>
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 lg:mt-3 pl-6 border-l-2 space-y-4 lg:space-y-3">
              {chapter.lessons.map((lesson) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  slug={course.slug}
                  isActive={currentLessonId === lesson.id}
                  completed={
                    lesson.lessonProgress.find(
                      (progress) => progress.lessonId === lesson.id
                    )?.completed || false
                  }
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
