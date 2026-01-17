"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Upload, X, Loader2, Camera } from "lucide-react";
import Image from "next/image";
import { useTranslations } from '@/components/general/I18nProvider';

interface ProfilePictureUploaderProps {
  currentImage?: string | null;
  userName: string;
  onUploadComplete: (imageUrl: string) => void;
}

export function ProfilePictureUploader({ 
  currentImage, 
  userName,
  onUploadComplete 
}: ProfilePictureUploaderProps) {
  const t = useTranslations();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file size (max 5MB for profile pictures)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("toasts.profile.fileSizeTooLarge"));
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error(t("toasts.profile.pleaseSelectImage"));
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);

    try {
      // Upload to server
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/user/profile/upload-picture', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Upload failed');
      }

      const { imageUrl } = await uploadResponse.json();
      
      setPreviewUrl(imageUrl);
      onUploadComplete(imageUrl);
      toast.success(t("toasts.profile.pictureUpdatedSuccess"));
      
      // Clean up object URL
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : t("toasts.profile.failedToUploadPicture"));
      // Revert preview on error
      setPreviewUrl(currentImage || null);
    } finally {
      setUploading(false);
    }
  }, [currentImage, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    setUploading(true);
    try {
      const response = await fetch('/api/user/profile/upload-picture', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove profile picture');
      }

      setPreviewUrl(null);
      onUploadComplete('');
      toast.success(t("toasts.profile.pictureRemovedSuccess"));
    } catch (error) {
      console.error('Remove error:', error);
      toast.error(t("toasts.profile.failedToRemovePicture"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        {/* Avatar Preview */}
        <div className="relative">
          <Avatar className="h-24 w-24 border-4 border-border">
            <AvatarImage 
              src={previewUrl || `https://avatar.vercel.sh/${userName}`} 
              alt={userName} 
            />
            <AvatarFallback className="text-2xl">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-3">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-primary/10">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              {isDragActive ? (
                <p className="text-sm font-medium">Drop the image here</p>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF or WebP (max 5MB)
                  </p>
                </>
              )}
            </div>
          </div>

          {previewUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Remove Picture
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
