"use client";

import { useState } from "react";
import { PublicCourseType } from "@/app/data/course/get-all-courses";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { useTranslations, useLocale } from "@/components/general/I18nProvider";
import { School, TimerIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface iAppProps {
  data: PublicCourseType;
}

export function PublicCourseCard({ data }: iAppProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(0);

  // Handle case where data might be undefined or fileKey is null
  if (!data) {
    return null;
  }

  const thumbnailUrl = useConstructUrl(data.fileKey || "");
  const fallbackImage = "/placeholder-course.jpg";

  // Get category name based on locale
  const getCategoryName = () => {
    if (data.courseCategory) {
      return locale === "ar" && data.courseCategory.nameAr
        ? data.courseCategory.nameAr
        : data.courseCategory.name;
    }
    return data.category;
  };

  // Get image URL with fallback
  const getImageUrl = () => {
    if (!data.fileKey || imageError) {
      return fallbackImage;
    }
    return thumbnailUrl;
  };

  // Handle image error with retry
  const handleImageError = () => {
    if (imageKey < 2) {
      setTimeout(() => setImageKey((prev) => prev + 1), 100);
    } else {
      setImageError(true);
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-border/50 shadow-sm bg-card w-full max-w-md min-h-[420px] flex flex-col">
      <Badge className="absolute top-3 ltr:right-3 rtl:left-3 z-10 bg-primary/90 text-primary-foreground shadow-sm">
        {data.level?.toLowerCase() === "beginner"
          ? t("courses.beginner")
          : data.level?.toLowerCase() === "intermediate"
            ? t("courses.intermediate")
            : data.level?.toLowerCase() === "advanced"
              ? t("courses.advanced")
              : data.level || t("courses.beginner")}
      </Badge>

      <div className="relative h-56 w-full overflow-hidden bg-muted/50 flex-shrink-0">
        <Image
          key={`${data.id}-${imageKey}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
          className="object-cover transition-all duration-500"
          src={getImageUrl()}
          alt={`Thumbnail for ${data.title}`}
          priority={false}
          loading="lazy"
          unoptimized
          onError={handleImageError}
        />
      </div>

      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex flex-col h-full">
          <div className="space-y-3 flex-1">
            <div className="text-center">
              <Link
                className="font-semibold text-xl line-clamp-2 hover:underline group-hover:text-primary transition-colors duration-200 block text-center"
                href={`/courses/${data.slug}`}
              >
                {data.title}
              </Link>
              <p className="line-clamp-2 text-sm text-muted-foreground mt-2 leading-relaxed text-center">
                {data.smallDescription}
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 py-3 px-3 bg-muted/30 rounded-lg border border-border/20">
              <div className="flex items-center gap-2">
                <TimerIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {data.duration}h
                </span>
              </div>
              <div className="flex items-center gap-2">
                <School className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {getCategoryName()}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 mt-auto">
            <Link
              href={`/courses/${data.slug}`}
              className={buttonVariants({
                size: "lg",
                className:
                  "w-full font-semibold shadow-sm hover:shadow-md transition-all duration-200",
              })}
            >
              {t("common.learnMore")}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PublicCourseCardSkeleton() {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-border/50 shadow-sm bg-card w-full max-w-md min-h-[420px] flex flex-col">
      <div className="absolute top-3 right-3 z-10">
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      <div className="relative h-56 w-full overflow-hidden bg-muted/50 flex-shrink-0">
        <Skeleton className="w-full h-full" />
      </div>

      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex flex-col h-full">
          <div className="space-y-3 flex-1">
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-8" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>

          <Skeleton className="w-full h-11 rounded-md mt-auto" />
        </div>
      </CardContent>
    </Card>
  );
}
