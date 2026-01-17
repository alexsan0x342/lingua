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
import { useDeleteChapter } from "@/hooks/use-deletion";
import { useRouter } from "next/navigation";

export function DeleteChapter({
  chapterId,
  courseId,
  chapterTitle,
}: {
  chapterId: string;
  courseId: string;
  chapterTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { deleteChapter, isDeleting } = useDeleteChapter({
    onSuccess: () => {
      toast.success("Chapter deleted successfully");
      setOpen(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error || "Failed to delete chapter");
    }
  });

  const handleDelete = () => {
    deleteChapter(chapterId);
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
            This action cannot be undone. This will permanently delete the chapter "{chapterTitle}" 
            and all its lessons.
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
