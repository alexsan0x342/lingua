"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, X, CheckCircle, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploaderProps {
  uploadType: 'logo' | 'favicon';
  currentImageUrl?: string;
  onUploadComplete: (imageUrl: string) => void;
  label?: string;
  description?: string;
}

export function ImageUploader({ 
  uploadType, 
  currentImageUrl, 
  onUploadComplete,
  label,
  description 
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Check file type
    const allowedTypes = uploadType === 'favicon' 
      ? ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']
      : ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      const typeMsg = uploadType === 'favicon' 
        ? "Please select an image file (PNG, JPG, GIF, WebP, or ICO for favicons)"
        : "Please select an image file (PNG, JPG, GIF, or WebP)";
      toast.error(typeMsg);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    setProgress(10);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadType', uploadType);
      formData.append('entityId', `site-${uploadType}`);

      setProgress(30);

      // Upload to public folder
      const uploadResponse = await fetch('/api/upload/public-file', {
        method: 'POST',
        body: formData,
      });

      setProgress(70);

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const { url } = await uploadResponse.json();
      setProgress(100);

      onUploadComplete(url);
      toast.success(`${uploadType === 'logo' ? 'Logo' : 'Favicon'} saved to public folder!`);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [uploadType, onUploadComplete, currentImageUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: uploadType === 'favicon' ? {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico']
    } : {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const handleRemove = () => {
    setPreviewUrl(null);
    onUploadComplete('');
  };

  return (
    <div className="space-y-4">
      {label && (
        <div>
          <h3 className="text-sm font-medium mb-1">{label}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {previewUrl ? (
        <div className="border-2 border-dashed border-green-200 bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-800">
                {uploadType === 'logo' ? 'Logo' : 'Favicon'} Uploaded
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRemove}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
          
          <div className="flex justify-center">
            <div className="relative">
              {uploadType === 'favicon' ? (
                <div className="w-16 h-16 relative bg-white rounded border p-2">
                  <Image
                    src={previewUrl}
                    alt="Favicon preview"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="relative max-w-xs">
                  <Image
                    src={previewUrl}
                    alt="Logo preview"
                    width={200}
                    height={100}
                    className="object-contain max-h-32"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            {uploadType === 'favicon' ? (
              <ImageIcon className="h-10 w-10 text-gray-400 mb-3" />
            ) : (
              <Upload className="h-10 w-10 text-gray-400 mb-3" />
            )}
            
            <h3 className="text-base font-medium text-gray-900 mb-1">
              {isDragActive ? `Drop your ${uploadType} here` : `Upload ${uploadType === 'logo' ? 'Logo' : 'Favicon'}`}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop an image, or click to select
            </p>
            <p className="text-xs text-gray-500">
              {uploadType === 'favicon' 
                ? 'PNG, JPG, GIF, WebP, or ICO (max 5MB)'
                : 'PNG, JPG, GIF, or WebP (max 5MB)'}
            </p>
            {uploadType === 'favicon' && (
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 32x32 or 64x64 pixels
              </p>
            )}
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}
    </div>
  );
}

