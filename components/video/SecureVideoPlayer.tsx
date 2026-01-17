"use client";

import { VideoWatermark } from "./VideoWatermark";

interface SecureVideoPlayerProps {
  publicId: string;
  lessonId?: string;
  thumbnailUrl?: string;
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
  onEnded?: () => void;
  onProgress?: (progress: number) => void;
  showWatermark?: boolean;
}

export function SecureVideoPlayer({
  className = "",
}: SecureVideoPlayerProps) {
  return (
    <div className={`bg-black aspect-video flex items-center justify-center ${className}`}>
      <p className="text-white text-center">Video player no longer supported (Cloudinary removed)</p>
    </div>
  );
}
