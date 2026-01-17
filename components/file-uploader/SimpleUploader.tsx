"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, X, CheckCircle } from "lucide-react";

interface SimpleUploaderProps {
  lessonId: string;
  onUploadComplete: (videoKey: string) => void;
  currentVideoKey?: string;
}

export function SimpleUploader({ lessonId, onUploadComplete, currentVideoKey }: SimpleUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadId, setUploadId] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file size (max 5GB)
    if (file.size > 5 * 1024 * 1024 * 1024) {
      toast.error("File size must be less than 5GB");
      return;
    }

    // Check file type
    if (!file.type.startsWith('video/')) {
      toast.error("Please select a video file");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Get upload URL from our API
      const uploadResponse = await fetch('/api/upload/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          fileName: file.name
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { uploadUrl, uploadId: newUploadId } = await uploadResponse.json();
      setUploadId(newUploadId);

      // Step 2: Upload directly to Mux
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setProgress(Math.round(percentComplete));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Upload failed'));
        };

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // Step 3: Update lesson with upload ID
      const updateResponse = await fetch('/api/admin/update-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          videoKey: newUploadId,
          migrationStatus: 'processing'
        }),
      });

      if (!updateResponse.ok) {
        console.warn('Failed to update lesson, but upload was successful');
      }

      onUploadComplete(newUploadId);
      
      toast.success("Video uploaded successfully! Processing will complete shortly.");
      setProgress(100);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  }, [lessonId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    maxFiles: 1,
    disabled: uploading
  });

  if (currentVideoKey) {
    return (
      <div className="border-2 border-dashed border-green-200 bg-green-50 rounded-lg p-6 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-green-800 mb-2">Video Uploaded</h3>
        <p className="text-green-600 mb-4">
          Your video has been uploaded and is being processed.
        </p>
        <Button 
          variant="outline" 
          onClick={() => onUploadComplete('')}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-2" />
          Remove Video
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? 'Drop your video here' : 'Upload Video'}
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop a video file, or click to select
        </p>
        <p className="text-sm text-gray-500">
          Supports MP4, MOV, AVI, MKV, WebM (max 5GB)
        </p>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          {uploadId && (
            <p className="text-xs text-gray-500">
              Upload ID: {uploadId}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
