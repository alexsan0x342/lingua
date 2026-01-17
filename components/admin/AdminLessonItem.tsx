"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmation } from "@/components/general/DeleteConfirmation";
import { useDeleteLesson } from "@/hooks/use-deletion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2, Edit, Play } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AdminLessonItemProps {
  lesson: {
    id: string;
    title: string;
    position: number;
    description: string | null;
    videoKey: string | null;
  };
  chapterId: string;
  courseId: string;
  onDelete?: () => void;
}

export function AdminLessonItem({ 
  lesson, 
  chapterId, 
  courseId, 
  onDelete 
}: AdminLessonItemProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { deleteLesson, isDeleting } = useDeleteLesson({
    onSuccess: () => {
      toast.success("Lesson deleted successfully");
      setShowDeleteDialog(false);
      onDelete?.();
      router.refresh();
    },
    onError: (error) => {
      toast.error(error || "Failed to delete lesson");
    }
  });

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    deleteLesson(lesson.id);
  };

  return (
    <>
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <Play className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{lesson.title}</h4>
            {lesson.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {lesson.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                Position: {lesson.position}
              </span>
              {lesson.videoKey && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                  Has Video
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href={`/admin/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}/edit`}>
              <Edit className="w-4 h-4" />
            </Link>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <DeleteConfirmation
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Lesson"
        description={`Are you sure you want to delete "${lesson.title}"? This will permanently remove the lesson and its video from Mux if it exists.`}
        isLoading={isDeleting}
        destructiveKeyword="Delete Lesson"
      />
    </>
  );
}
