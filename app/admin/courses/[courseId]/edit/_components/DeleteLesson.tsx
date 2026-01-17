"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDeleteLesson } from "@/hooks/use-deletion";
import { useRouter } from "next/navigation";

export function DeleteLesson({
  chapterId,
  courseId,
  lessonId,
  lessonTitle,
}: {
  chapterId: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { deleteLesson, isDeleting } = useDeleteLesson({
    onSuccess: () => {
      toast.success("Lesson deleted successfully");
      setOpen(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error || "Failed to delete lesson");
    }
  });

  const handleDelete = () => {
    deleteLesson(lessonId);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the lesson "{lessonTitle}" 
            and remove all associated data including videos from Mux.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button onClick={handleDelete} disabled={isDeleting} variant="destructive">
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
