"use client";

import { useState } from "react";

interface DeleteOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useDeleteLesson(options?: DeleteOptions) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteLesson = async (lessonId: string) => {
    if (!lessonId) {
      options?.onError?.("Lesson ID is required");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete lesson");
      }

      options?.onSuccess?.();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      options?.onError?.(error instanceof Error ? error.message : "Failed to delete lesson");
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteLesson, isDeleting };
}

export function useDeleteChapter(options?: DeleteOptions) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteChapter = async (chapterId: string) => {
    if (!chapterId) {
      options?.onError?.("Chapter ID is required");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete chapter");
      }

      options?.onSuccess?.();
    } catch (error) {
      console.error("Error deleting chapter:", error);
      options?.onError?.(error instanceof Error ? error.message : "Failed to delete chapter");
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteChapter, isDeleting };
}

export function useDeleteCourse(options?: DeleteOptions) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteCourse = async (courseId: string) => {
    if (!courseId) {
      options?.onError?.("Course ID is required");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete course");
      }

      options?.onSuccess?.();
    } catch (error) {
      console.error("Error deleting course:", error);
      options?.onError?.(error instanceof Error ? error.message : "Failed to delete course");
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteCourse, isDeleting };
}

export function useDeleteFile(options?: DeleteOptions) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteFile = async (type: "image" | "video", identifier: string) => {
    if (!identifier) {
      options?.onError?.(`${type === "image" ? "File key" : "Asset ID"} is required`);
      return;
    }

    setIsDeleting(true);
    try {
      const body = type === "image" 
        ? { type: "image", fileKey: identifier }
        : { type: "video", assetId: identifier };

      const response = await fetch("/api/admin/files/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to delete ${type}`);
      }

      options?.onSuccess?.();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      options?.onError?.(error instanceof Error ? error.message : `Failed to delete ${type}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteFile, isDeleting };
}

export function useCleanupFiles(options?: DeleteOptions) {
  const [isCleaning, setIsCleaning] = useState(false);

  const cleanupFiles = async () => {
    setIsCleaning(true);
    try {
      const response = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cleanup files");
      }

      options?.onSuccess?.();
    } catch (error) {
      console.error("Error cleaning up files:", error);
      options?.onError?.(error instanceof Error ? error.message : "Failed to cleanup files");
    } finally {
      setIsCleaning(false);
    }
  };

  return { cleanupFiles, isCleaning };
}
