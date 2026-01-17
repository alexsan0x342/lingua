"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";

interface BulletproofUploaderProps {
  lessonId: string;
  onUploadComplete: (key: string) => void;
  currentKey?: string;
  fileType: 'image' | 'video';
}

export function BulletproofUploader({ 
  lessonId, 
  onUploadComplete, 
  currentKey, 
  fileType 
}: BulletproofUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Reset state
    setError(null);
    setUploading(true);
    setProgress(0);
    setUploadId(null);

    try {
      // Check file size (max 5GB for videos, 50MB for images)
      const maxSize = fileType === 'video' ? 5 * 1024 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / 1024 / 1024);
        throw new Error(`File size must be less than ${maxSizeMB}MB`);
      }

      // Check file type
      if (fileType === 'video' && !file.type.startsWith('video/')) {
        throw new Error("Please select a video file");
      }
      if (fileType === 'image' && !file.type.startsWith('image/')) {
        throw new Error("Please select an image file");
      }

      if (fileType === 'image') {
        // Direct image upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('lessonId', lessonId);
        formData.append('isImage', 'true');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        onUploadComplete(result.key);
        toast.success("Image uploaded successfully!");
        setProgress(100);

      } else {
        // Video upload - get upload URL first
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lessonId,
            fileName: file.name,
            isImage: false
          }),
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          
          // Handle Mux plan limit error
          if (errorData.error === "MUX_PLAN_LIMIT") {
            toast.error(
              <div className="space-y-2">
                <div className="font-medium">Mux Plan Limit Reached</div>
                <div className="text-sm text-muted-foreground">
                  {errorData.message}
                </div>
                <div className="text-xs text-muted-foreground">
                  {errorData.details}
                </div>
                <div className="text-xs">
                  <strong>Solutions:</strong>
                  <ul className="mt-1 space-y-1">
                    {errorData.alternatives.map((alt: string, index: number) => (
                      <li key={index}>• {alt}</li>
                    ))}
                  </ul>
                </div>
              </div>,
              { duration: 10000 }
            );
            return;
          }
          
          throw new Error(errorData.error || 'Failed to get upload URL');
        }

        const { uploadUrl, uploadId: newUploadId } = await uploadResponse.json();
        setUploadId(newUploadId);

        // Upload directly to Mux
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

        onUploadComplete(newUploadId);
        toast.success("Video uploaded successfully! Processing will complete shortly.");
        setProgress(100);
      }

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  }, [lessonId, onUploadComplete, fileType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: fileType === 'video' ? {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    } : {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: uploading
  });

  if (currentKey) {
    return (
      <div className="border-2 border-dashed border-green-200 bg-green-50 rounded-lg p-6 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-green-800 mb-2">
          {fileType === 'video' ? 'Video' : 'Image'} Uploaded
        </h3>
        <p className="text-green-600 mb-4">
          Your {fileType} has been uploaded successfully.
          {fileType === 'video' && ' Processing will complete shortly.'}
        </p>
        <Button 
          variant="outline" 
          onClick={() => onUploadComplete('')}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-2" />
          Remove {fileType === 'video' ? 'Video' : 'Image'}
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
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? `Drop your ${fileType} here` : `Upload ${fileType === 'video' ? 'Video' : 'Image'}`}
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop a {fileType} file, or click to select
        </p>
        <p className="text-sm text-gray-500">
          {fileType === 'video' 
            ? 'Supports MP4, MOV, AVI, MKV, WebM (max 5GB)'
            : 'Supports JPG, PNG, GIF, WebP (max 50MB)'
          }
        </p>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

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




