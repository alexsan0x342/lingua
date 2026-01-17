"use client";

import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { 
  X, 
  Upload, 
  Film, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileVideo,
  Cloud
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

interface VideoUploaderProps {
  value?: string;
  onChange?: (publicId: string) => void;
  lessonId?: string;
  courseId?: string;
  maxSizeMB?: number;
  className?: string;
  onUploadComplete?: (data: { publicId: string; url: string; duration?: number }) => void;
}

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

export function VideoUploader({
  value,
  onChange,
  lessonId,
  courseId,
  maxSizeMB = 1000,
  className,
  onUploadComplete,
}: VideoUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>(value ? "success" : "idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPublicId, setCurrentPublicId] = useState<string | null>(value || null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const abortControllerRef = useRef<XMLHttpRequest | null>(null);

  const uploadVideo = useCallback(
    async (file: File) => {
      setStatus("uploading");
      setUploadProgress(0);
      setErrorMessage(null);
      setFileName(file.name);
      setFileSize(file.size);

      try {
        console.log(`📹 Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

        // Validate file type
        const validTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm"];
        if (!validTypes.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.type}. Please upload MP4, MOV, AVI, MKV, or WebM files.`);
        }

        // Validate file size
        const fileSizeMB = file.size / 1024 / 1024;
        if (fileSizeMB > maxSizeMB) {
          throw new Error(`File too large (${fileSizeMB.toFixed(1)} MB). Maximum size is ${maxSizeMB} MB.`);
        }

        // Step 1: Get signed upload parameters from our server
        console.log("🔑 Getting signed upload parameters...");
        const paramsResponse = await fetch("/api/upload/cloudinary-params", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId: lessonId || "",
            courseId: courseId || "",
            title: file.name.replace(/\.[^/.]+$/, ""),
          }),
        });

        if (!paramsResponse.ok) {
          const error = await paramsResponse.json();
          throw new Error(error.error || error.details || "Failed to get upload parameters");
        }

        const uploadParams = await paramsResponse.json();
        console.log("✅ Got signed parameters, uploading directly to Cloudinary...");

        // Step 2: Upload directly to Cloudinary (bypasses Next.js server!)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("signature", uploadParams.signature);
        formData.append("timestamp", uploadParams.timestamp.toString());
        formData.append("api_key", uploadParams.apiKey);
        formData.append("folder", uploadParams.folder);
        formData.append("eager", uploadParams.eager);
        formData.append("eager_async", "true");
        formData.append("resource_type", "video");
        if (uploadParams.context) {
          formData.append("context", uploadParams.context);
        }

        // Upload with progress tracking
        const result = await new Promise<{ publicId: string; url: string; duration?: number }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          abortControllerRef.current = xhr;

          // Track upload progress
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percentComplete);
            }
          });

          // Handle successful upload
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                console.log("✅ Upload successful:", response.public_id);
                resolve({
                  publicId: response.public_id,
                  url: response.secure_url,
                  duration: response.duration,
                });
              } catch (parseError) {
                console.error("Failed to parse response:", parseError);
                reject(new Error("Invalid response from Cloudinary"));
              }
            } else {
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                reject(new Error(errorResponse.error?.message || `Upload failed (${xhr.status})`));
              } catch {
                reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
              }
            }
          });

          // Handle network errors
          xhr.addEventListener("error", () => {
            console.error("❌ Network error during upload");
            reject(new Error("Network error. Please check your connection and try again."));
          });

          // Handle timeout
          xhr.addEventListener("timeout", () => {
            console.error("⏱️ Upload timeout");
            reject(new Error("Upload timed out. Please try again with a smaller file or better connection."));
          });

          // Set timeout (20 minutes for very large videos)
          xhr.timeout = 1200000;

          // Send directly to Cloudinary
          xhr.open("POST", uploadParams.uploadUrl);
          xhr.send(formData);
        });

        // Upload complete - now update database if lessonId provided
        setStatus("processing");
        setUploadProgress(100);

        // Update lesson in database
        if (lessonId && lessonId !== "new") {
          try {
            console.log("📝 Updating lesson in database...");
            await fetch(`/api/admin/lessons/${lessonId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                videoKey: result.publicId,
                migrationStatus: "ready",
                videoUrl: result.url,
              }),
            });
            console.log("✅ Lesson updated");
          } catch (dbError) {
            console.warn("Failed to update lesson:", dbError);
            // Don't fail the upload if DB update fails
          }
        }

        // Save the result
        setCurrentPublicId(result.publicId);
        setUploadedUrl(result.url);
        onChange?.(result.publicId);
        onUploadComplete?.(result);

        // Wait a moment to show processing state
        await new Promise(resolve => setTimeout(resolve, 1500));

        setStatus("success");
        toast.success("Video uploaded successfully!", {
          description: "Your video is ready for streaming."
        });

      } catch (error) {
        console.error("❌ Upload error:", error);
        const message = error instanceof Error ? error.message : "Upload failed";
        setErrorMessage(message);
        setStatus("error");
        toast.error("Upload failed", {
          description: message
        });
      } finally {
        abortControllerRef.current = null;
      }
    },
    [lessonId, courseId, maxSizeMB, onChange, onUploadComplete]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === "file-too-large") {
          toast.error(`File too large. Maximum size is ${maxSizeMB} MB.`);
        } else if (rejection.errors[0]?.code === "file-invalid-type") {
          toast.error("Invalid file type. Please upload a video file.");
        } else {
          toast.error("File rejected: " + rejection.errors[0]?.message);
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        uploadVideo(acceptedFiles[0]);
      }
    },
    [uploadVideo, maxSizeMB]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
    },
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
    disabled: status === "uploading" || status === "processing",
  });

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStatus("idle");
      setUploadProgress(0);
      toast.info("Upload cancelled");
    }
  };

  const handleRemove = () => {
    setStatus("idle");
    setCurrentPublicId(null);
    setUploadedUrl(null);
    setUploadProgress(0);
    setErrorMessage(null);
    onChange?.("");
  };

  const handleRetry = () => {
    setStatus("idle");
    setErrorMessage(null);
    setUploadProgress(0);
  };

  return (
    <Card className={cn("p-6", className)}>
      {/* Idle State - Drop Zone */}
      {status === "idle" && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer",
            "hover:border-primary/50 hover:bg-accent/50",
            isDragActive && "border-primary bg-accent"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Cloud className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                {isDragActive ? "Drop your video here" : "Upload video to Cloudinary"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag & drop or click to select
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports MP4, MOV, AVI, MKV, WebM • Max {maxSizeMB} MB
              </p>
            </div>
            <Button variant="outline" type="button">
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
        </div>
      )}

      {/* Uploading State */}
      {(status === "uploading" || status === "processing") && (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 mt-1">
              {status === "uploading" ? (
                <Upload className="h-5 w-5 text-primary animate-pulse" />
              ) : (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{fileName}</h4>
              <p className="text-sm text-muted-foreground">
                {status === "uploading" 
                  ? `Uploading... ${uploadProgress}%` 
                  : "Processing video for streaming..."}
              </p>
            </div>
            {status === "uploading" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {(fileSize / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        </div>
      )}

      {/* Success State */}
      {status === "success" && currentPublicId && (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-green-500/10 p-2 mt-1">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium">Video uploaded successfully!</h4>
              <p className="text-sm text-muted-foreground truncate">
                {fileName || currentPublicId}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3">
            <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
              <Film className="h-4 w-4" />
              Ready for streaming with adaptive quality
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {status === "error" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-destructive/10 p-2 mt-1">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-destructive">Upload failed</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {errorMessage}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              type="button"
            >
              Try Again
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              type="button"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
