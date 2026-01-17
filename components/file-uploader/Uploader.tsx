"use client";

import { useCallback, useState, useMemo } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";
import {
  RenderEmptyState,
  RenderErrorState,
  RenderUploadedState,
  RenderUploadingState,
} from "./RenderState";
import { toast } from "sonner";

// Helper to construct CDN URL from storage key
function getImageUrl(key: string | undefined): string | undefined {
  if (!key) return undefined;

  // If already a full URL, return as-is
  if (key.startsWith("http")) return key;

  // If it's a storage path (courses/, lessons/, etc.), construct CDN URL
  if (
    key.match(
      /^(lessons?|courses?|profiles?|logo|favicon|assignments|resources|images)\//,
    )
  ) {
    return `https://cdn.lingua-ly.com/${key}`;
  }

  // Legacy local paths
  if (key.startsWith("/")) return key;

  return undefined;
}

interface UploaderState {
  uploading: boolean;
  progress: number;
  isDeleting: boolean;
  error: boolean;
  // After upload, store the CDN URL directly
  uploadedUrl?: string;
  uploadedKey?: string;
  fileName?: string;
}

interface iAppProps {
  value?: string;
  onChange?: (value: string) => void;
  fileTypeAccepted: "image" | "video";
  lessonId?: string;
  uploadType?: "lesson" | "course" | "logo" | "favicon";
  entityId?: string;
}

export function Uploader({
  onChange,
  value,
  fileTypeAccepted,
  lessonId,
  uploadType = "lesson",
  entityId,
}: iAppProps) {
  const [state, setState] = useState<UploaderState>({
    uploading: false,
    progress: 0,
    isDeleting: false,
    error: false,
  });

  // Compute the display URL - prioritize uploaded URL, then derive from value
  const displayUrl = useMemo(() => {
    // If we just uploaded something, use that URL
    if (state.uploadedUrl) return state.uploadedUrl;
    // Otherwise derive from the stored key (value prop)
    return getImageUrl(value);
  }, [state.uploadedUrl, value]);

  // The key to use for deletion
  const currentKey = state.uploadedKey || value;

  const uploadFile = useCallback(
    async (file: File) => {
      setState((prev) => ({
        ...prev,
        uploading: true,
        progress: 0,
        error: false,
        fileName: file.name,
      }));

      try {
        if (fileTypeAccepted === "image") {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("uploadType", uploadType);
          formData.append("entityId", entityId || lessonId || "");

          const response = await fetch("/api/upload/bunny-image", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to upload image");
          }

          const result = await response.json();

          // Store the uploaded URL and key
          setState((prev) => ({
            ...prev,
            progress: 100,
            uploading: false,
            uploadedUrl: result.url,
            uploadedKey: result.key,
          }));

          // Notify parent with the key
          onChange?.(result.key);
          toast.success("Image uploaded successfully");
        } else {
          // Video upload to Cloudinary
          const signatureResponse = await fetch("/api/upload/video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lessonId,
              filename: file.name,
            }),
          });

          if (!signatureResponse.ok) {
            const errorData = await signatureResponse.json();
            throw new Error(
              errorData.error || "Failed to get upload signature",
            );
          }

          const {
            uploadUrl,
            publicId,
            signature,
            timestamp,
            apiKey,
            cloudName,
          } = await signatureResponse.json();

          const videoFormData = new FormData();
          videoFormData.append("file", file);
          videoFormData.append("api_key", apiKey);
          videoFormData.append("timestamp", timestamp.toString());
          videoFormData.append("signature", signature);
          videoFormData.append("public_id", publicId);
          videoFormData.append("resource_type", "video");

          const xhr = new XMLHttpRequest();

          await new Promise<void>((resolve, reject) => {
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const pct = Math.round((event.loaded / event.total) * 100);
                setState((prev) => ({ ...prev, progress: pct }));
              }
            };

            xhr.onload = () => {
              if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                setState((prev) => ({
                  ...prev,
                  progress: 100,
                  uploading: false,
                  uploadedUrl: response.secure_url,
                  uploadedKey: response.public_id,
                }));
                onChange?.(response.public_id);
                toast.success("Video uploaded successfully");
                resolve();
              } else {
                reject(new Error(`Upload failed: ${xhr.statusText}`));
              }
            };

            xhr.onerror = () =>
              reject(new Error("Network error during upload"));

            xhr.open(
              "POST",
              `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
            );
            xhr.send(videoFormData);
          });
        }
      } catch (error) {
        console.error("Upload error:", error);
        const message =
          error instanceof Error ? error.message : "Upload failed";
        toast.error(message);
        setState((prev) => ({
          ...prev,
          uploading: false,
          progress: 0,
          error: true,
        }));
      }
    },
    [fileTypeAccepted, onChange, uploadType, entityId, lessonId],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        uploadFile(acceptedFiles[0]);
      }
    },
    [uploadFile],
  );

  const handleRemoveFile = useCallback(async () => {
    if (state.isDeleting || !currentKey) return;

    try {
      setState((prev) => ({ ...prev, isDeleting: true }));

      // Check if it's a Bunny.net image file
      const isBunnyImageFile = currentKey.match(
        /^(lessons?|courses?|profiles?|logo|favicon|assignments|resources|images)\//,
      );

      // Check if it's a Bunny.net video (UUID format)
      const isBunnyVideoFile =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          currentKey,
        );

      if (isBunnyImageFile) {
        const response = await fetch(`/api/upload/bunny-image/${currentKey}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          console.error("Failed to delete image from Bunny");
        }
      } else if (isBunnyVideoFile) {
        const response = await fetch(`/api/upload/bunny-video/${currentKey}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          console.error("Failed to delete video from Bunny");
        }
      }

      // Clear local state
      setState({
        uploading: false,
        progress: 0,
        isDeleting: false,
        error: false,
        uploadedUrl: undefined,
        uploadedKey: undefined,
      });

      // Notify parent
      onChange?.("");
      toast.success("File removed");
    } catch (error) {
      console.error("Error removing file:", error);
      toast.error("Failed to remove file");
      setState((prev) => ({ ...prev, isDeleting: false }));
    }
  }, [currentKey, onChange, state.isDeleting]);

  const rejectedFiles = useCallback((fileRejections: FileRejection[]) => {
    for (const rejection of fileRejections) {
      const fileTooLarge = rejection.errors.some(
        (e) => e.code === "file-too-large",
      );
      const invalidType = rejection.errors.some(
        (e) => e.code === "file-invalid-type",
      );
      const tooManyFiles = rejection.errors.some(
        (e) => e.code === "too-many-files",
      );

      if (fileTooLarge) {
        toast.error("File is too large");
      }
      if (invalidType) {
        toast.error("Invalid file type");
      }
      if (tooManyFiles) {
        toast.error("Too many files selected, max is 1");
      }
    }
  }, []);

  const renderContent = () => {
    if (state.uploading) {
      return (
        <RenderUploadingState
          fileName={state.fileName}
          progress={state.progress}
        />
      );
    }

    if (state.error) {
      return (
        <RenderErrorState
          onRetry={() =>
            setState({
              uploading: false,
              progress: 0,
              isDeleting: false,
              error: false,
              uploadedUrl: undefined,
              uploadedKey: undefined,
            })
          }
        />
      );
    }

    if (displayUrl) {
      return (
        <RenderUploadedState
          handleRemoveFile={handleRemoveFile}
          previewUrl={displayUrl}
          isDeleting={state.isDeleting}
          fileType={fileTypeAccepted}
        />
      );
    }

    return <RenderEmptyState isDragActive={isDragActive} />;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:
      fileTypeAccepted === "video"
        ? { "video/*": [] }
        : uploadType === "favicon"
          ? {
              "image/*": [],
              "image/x-icon": [".ico"],
              "image/vnd.microsoft.icon": [".ico"],
            }
          : { "image/*": [] },
    maxFiles: 1,
    multiple: false,
    maxSize:
      fileTypeAccepted === "image" ? 5 * 1024 * 1024 : 5000 * 1024 * 1024,
    onDropRejected: rejectedFiles,
    disabled: state.uploading || !!displayUrl,
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed transition-colors duration-200 ease-in-out w-full",
        displayUrl ? "border-0 h-auto p-0" : "h-64",
        isDragActive
          ? "border-primary bg-primary/10 border-solid"
          : "border-border hover:border-primary",
      )}
    >
      <CardContent
        className={cn(
          "flex w-full",
          displayUrl
            ? "p-0 h-auto items-start"
            : "h-full p-4 items-center justify-center",
        )}
      >
        <input {...getInputProps()} />
        {renderContent()}
      </CardContent>
    </Card>
  );
}
