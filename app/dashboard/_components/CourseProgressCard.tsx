/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { EnrolledCourseType } from "@/app/data/user/get-enrolled-courses";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { useConstructUrl } from "@/hooks/use-construct-url";
import { useCourseProgress } from "@/hooks/use-course-progress";
import { useTranslations, useLocale } from "@/components/general/I18nProvider";

import Image from "next/image";
import Link from "next/link";

interface iAppProps {
  data: EnrolledCourseType;
}

export function CourseProgressCard({ data }: iAppProps) {
  const t = useTranslations();
  const locale = useLocale();
  const thumbnailUrl = useConstructUrl(data.Course.fileKey);
  const { totalLessons, completedLessons, progressPercentage } =
    useCourseProgress({ courseData: data.Course as any });
  
  // Get level translation
  const getLevelText = () => {
    const level = data.Course.level?.toLowerCase();
    if (level === "beginner") return t("courses.beginner");
    if (level === "intermediate") return t("courses.intermediate");
    if (level === "advanced") return t("courses.advanced");
    return data.Course.level;
  };
  
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-border/50 shadow-sm bg-card w-full max-w-md min-h-[420px] flex flex-col">
      <Badge className="absolute top-3 ltr:right-3 rtl:left-3 z-10 bg-primary/90 text-primary-foreground shadow-sm">
        {getLevelText()}
      </Badge>

      <div className="relative h-56 w-full overflow-hidden bg-muted/50 flex-shrink-0">
        <Image
          fill
          className="object-cover object-center transition-all duration-500"
          src={thumbnailUrl || "/placeholder-course.jpg"}
          alt={`Thumbnail for ${data.Course.title}`}
          priority={false}
          loading="lazy"
          unoptimized={thumbnailUrl?.startsWith('/api/') || thumbnailUrl?.includes('cdn.lingua-ly.com') || thumbnailUrl?.includes('cdn.novally.tech')}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder-course.jpg";
          }}
        />
      </div>

      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex flex-col h-full">
          <div className="space-y-3 flex-1">
            <div>
              <Link
                className="font-semibold text-xl leading-tight line-clamp-2 hover:underline group-hover:text-primary transition-colors duration-200 block"
                href={`/dashboard/${data.Course.slug}`}
              >
                {data.Course.title}
              </Link>
              <p className="line-clamp-2 text-sm text-muted-foreground mt-2 leading-relaxed">
                {data.Course.smallDescription}
              </p>
            </div>

            <div className="space-y-3 py-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">{t("dashboard.progress")}</span>
                <span className="text-lg font-bold text-primary">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="w-full h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{completedLessons} {t("dashboard.of")} {totalLessons} {t("dashboard.lessonsCompleted")}</span>
                <span>{totalLessons - completedLessons} {t("dashboard.lessonsRemaining")}</span>
              </div>
            </div>
          </div>

          <Link
            href={`/dashboard/${data.Course.slug}`}
            className={buttonVariants({ 
              size: "lg",
              className: "w-full mt-auto font-semibold shadow-sm hover:shadow-md transition-all duration-200" 
            })}
          >
            {t("dashboard.continueLearning")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
