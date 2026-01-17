"use client";

import { AdminCourseType } from "@/app/data/admin/admin-get-courses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { useDeleteCourse } from "@/hooks/use-deletion";
import { DeleteConfirmation } from "@/components/general/DeleteConfirmation";
import {
  ArrowRight,
  BookOpen,
  Eye,
  MoreVertical,
  Pencil,
  School,
  TimerIcon,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface iAppProps {
  data: AdminCourseType;
}

export function AdminCourseCard({ data }: iAppProps) {
  const thumbnailUrl = useConstructUrl(data.fileKey || "");
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(0);

  const { deleteCourse, isDeleting } = useDeleteCourse({
    onSuccess: () => {
      toast.success("Course deleted successfully");
      setShowDeleteDialog(false);
      router.refresh(); // Refresh the page to update the course list
    },
    onError: (error) => {
      toast.error(error || "Failed to delete course");
    },
  });

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    deleteCourse(data.id);
  };

  // Get the proper image URL - handle empty or invalid fileKey
  const getImageUrl = () => {
    if (!data.fileKey || imageError) {
      return "/placeholder-course.svg";
    }
    return thumbnailUrl;
  };

  // Handle image error with retry
  const handleImageError = () => {
    if (imageKey < 2) {
      // Retry up to 2 times
      setTimeout(() => setImageKey((prev) => prev + 1), 100);
    } else {
      setImageError(true);
    }
  };

  return (
    <>
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-border/50 shadow-sm bg-card w-full h-full flex flex-col">
        {/* Course Image */}
        <div className="relative h-44 w-full overflow-hidden bg-muted/50 flex-shrink-0">
          {/* Actions Dropdown */}
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="shadow-lg backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 border-0"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/courses/${data.id}/edit`}>
                    <Pencil className="size-4 mr-2" />
                    Edit Course
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/courses/${data.slug}`}>
                    <Eye className="size-4 mr-2" />
                    Preview
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Image
            key={`${data.id}-${imageKey}`}
            src={getImageUrl()}
            alt={data.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-all duration-500 group-hover:scale-105"
            unoptimized
            priority={false}
            onError={handleImageError}
          />
        </div>

        <CardContent className="p-4 flex-1 flex flex-col min-h-0">
          <div className="flex flex-col h-full">
            {/* Course Status and Price */}
            <div className="flex items-center justify-between mb-2">
              <Badge
                variant={data.status === "Published" ? "default" : "secondary"}
                className="text-xs shadow-sm"
              >
                {data.status}
              </Badge>
              <Badge variant="outline" className="text-xs font-semibold">
                {data.price} LYD
              </Badge>
            </div>

            {/* Course Title and Description */}
            <div className="space-y-1 flex-1">
              <Link
                href={`/admin/courses/${data.id}/edit`}
                className="font-semibold text-base leading-tight hover:underline group-hover:text-primary transition-colors line-clamp-2 block"
              >
                {data.title}
              </Link>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {data.smallDescription}
              </p>
            </div>

            {/* Course Stats */}
            <div className="flex items-center justify-between text-xs text-muted-foreground py-2 mb-2">
              <div className="flex items-center gap-1">
                <TimerIcon className="h-3 w-3 text-primary" />
                <span className="font-medium">{data.duration}h</span>
              </div>
              <div className="flex items-center gap-1">
                <School className="h-3 w-3 text-primary" />
                <span className="font-medium">{data.level}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3 text-primary" />
                <span className="font-medium">Course</span>
              </div>
            </div>

            {/* Action Buttons - Always at bottom */}
            <div className="flex gap-2 mt-auto pt-2 border-t border-border/50">
              <Link href={`/admin/courses/${data.id}/edit`} className="flex-1">
                <Button className="w-full h-8 font-medium text-xs" size="sm">
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </Link>
              <Link href={`/courses/${data.slug}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmation
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Course"
        description={`Are you sure you want to delete "${data.title}"? This will permanently remove the course, all its lessons, videos from Mux, and local files. All enrollments will also be deleted.`}
        isLoading={isDeleting}
        destructiveKeyword="Delete Course"
      />
    </>
  );
}

export function AdminCourseCardSkeleton() {
  return (
    <Card className="group relative overflow-hidden border w-full h-full flex flex-col">
      <div className="absolute top-2 right-2 z-10">
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <div className="h-44 w-full relative flex-shrink-0">
        <Skeleton className="w-full h-full" />
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>

          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-8 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          </div>

          <div className="flex gap-2 mt-auto">
            <Skeleton className="flex-1 h-9 rounded" />
            <Skeleton className="w-12 h-9 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
