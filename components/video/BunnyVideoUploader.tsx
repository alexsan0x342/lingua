"use client";

import { useCallback, useState } from "react";
import {
  Upload,
  Video,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useDropzone, FileRejection } from "react-dropzone";

interface BunnyVideoUploaderProps {
  value?: string;
  onChange?: (videoId: string) => void;
  lessonId?: string;
  courseId?: string;
  maxSizeMB?: number;
}

export function BunnyVideoUploader({
  value,
  onChange,
  lessonId,
  courseId,
  maxSizeMB = 500,
}: BunnyVideoUploaderProps) {
  const [currentVideoId, setCurrentVideoId] = useState(value || "");
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const uploadToBunny = useCallback(
    async (file: File) => {
      try {
        setState("uploading");
        setProgress(0);
        setErrorMessage("");

        console.log("File details:", {
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: file.type,
          maxAllowed: `${maxSizeMB} MB`,
        });

        // Step 1: Create video entry and get upload credentials
        console.log("📝 Creating video entry in Bunny.net...");
        const createResponse = await fetch("/api/upload/bunny-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            lessonId,
            courseId,
          }),
        });

        if (!createResponse.ok) {
          const error = await createResponse.json();
          throw new Error(
            error.details || error.error || "Failed to create video entry",
          );
        }

        const uploadCredentials = await createResponse.json();
        console.log("✅ Video entry created:", uploadCredentials.videoId);

        // Step 2: Upload directly to Bunny.net (bypasses Next.js!)
        console.log("📤 Starting direct upload to Bunny.net...");

        const result = await new Promise<{ videoId: string }>(
          (resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const pct = Math.round((event.loaded / event.total) * 100);
                setProgress(pct);
                if (pct % 10 === 0) {
                  console.log(`Upload progress: ${pct}%`);
                }
              }
            };

            xhr.onload = () => {
              if (xhr.status === 200) {
                console.log("✅ Upload success");
                resolve({ videoId: uploadCredentials.videoId });
              } else {
                console.error("Upload failed:", xhr.status, xhr.statusText);
                reject(
                  new Error(`Upload failed (${xhr.status}): ${xhr.statusText}`),
                );
              }
            };

            xhr.onerror = () => {
              console.error("❌ Network error");
              reject(new Error("Network error occurred"));
            };

            xhr.ontimeout = () => {
              console.error("⏱️ Upload timeout");
              reject(new Error("Upload timed out"));
            };

            // 30 minutes timeout for large videos
            xhr.timeout = 1800000;

            // Upload directly to Bunny.net
            xhr.open("PUT", uploadCredentials.uploadUrl);
            xhr.setRequestHeader("AccessKey", uploadCredentials.apiKey);
            xhr.setRequestHeader("Content-Type", "application/octet-stream");
            xhr.send(file);
          },
        );

        // Success!
        setCurrentVideoId(result.videoId);
        setState("success");
        onChange?.(result.videoId);
        toast.success(
          "Video uploaded successfully! Processing may take a few minutes.",
        );
      } catch (error) {
        console.error("Upload error:", error);
        const message =
          error instanceof Error ? error.message : "Upload failed";
        setErrorMessage(message);
        setState("error");
        toast.error(message);
      }
    },
    [lessonId, courseId, onChange, maxSizeMB],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        uploadToBunny(acceptedFiles[0]);
      }
    },
    [uploadToBunny],
  );

  const handleReject = useCallback(
    (rejections: FileRejection[]) => {
      const rejection = rejections[0];
      if (rejection?.errors[0]?.code === "file-too-large") {
        toast.error(`File too large. Maximum size is ${maxSizeMB}MB`);
      } else if (rejection?.errors[0]?.code === "file-invalid-type") {
        toast.error("Invalid file type. Please upload a video file.");
      } else {
        toast.error("File rejected. Please try again.");
      }
    },
    [maxSizeMB],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: handleReject,
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".webm", ".mkv"],
    },
    maxFiles: 1,
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: state === "uploading",
  });

  const handleRemove = useCallback(async () => {
    if (!currentVideoId) return;

    try {
      // Delete from Bunny.net Stream
      const response = await fetch(
        `/api/upload/bunny-video/${currentVideoId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to delete video from Bunny:", errorData);
        // Continue with UI removal even if server delete fails
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      // Continue with UI removal even if server delete fails
    }

    setCurrentVideoId("");
    setState("idle");
    setProgress(0);
    onChange?.("");
    toast.success("Video removed");
  }, [onChange, currentVideoId]);

  return (
    <div className="space-y-4">
      {/* Existing Video Preview */}
      {currentVideoId && state === "idle" && (
        <div className="relative w-full max-w-2xl">
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-black">
            <div className="w-full h-[400px]">
              <iframe
                src={`https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID}/${currentVideoId}`}
                loading="lazy"
                style={{
                  border: 0,
                  width: "100%",
                  height: "100%",
                }}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              />
            </div>
          </div>
          <div className="absolute top-2 right-2">
            <button
              onClick={handleRemove}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              type="button"
              title="Remove video"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {state === "idle" && !currentVideoId && (
        <div
          {...getRootProps()}
          className={`
            relative w-full border-2 border-dashed rounded-lg p-8
            transition-all cursor-pointer
            ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/30"
            }
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragActive ? "Drop video here" : "Upload Video"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop or click to select
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                MP4, MOV, AVI, WebM, MKV (max {maxSizeMB}MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uploading State */}
      {state === "uploading" && (
        <div className="border rounded-lg p-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
            <div className="text-center w-full">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Uploading to Bunny.net... {progress}%
              </p>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5 mt-3">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-2">
                Please wait while your video is being uploaded
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {state === "success" && currentVideoId && (
        <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Video Uploaded Successfully
                </p>
                <p className="text-xs text-green-600/80 dark:text-green-400/80 font-mono truncate">
                  ID: {currentVideoId}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-1.5 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/50 rounded transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {state === "error" && (
        <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Upload Failed
                </p>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                  {errorMessage}
                </p>
              </div>
            </div>
            <button
              onClick={() => setState("idle")}
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
              type="button"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
