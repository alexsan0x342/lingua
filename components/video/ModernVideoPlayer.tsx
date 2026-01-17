"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import { Loader2, AlertCircle, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ModernVideoPlayerProps {
  publicId: string;
  cloudName?: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
  onEnded?: () => void;
  onProgress?: (progress: number) => void;
  watermark?: React.ReactNode;
  lessonId?: string;
  title?: string;
}

export function ModernVideoPlayer({
  publicId,
  cloudName,
  poster,
  autoPlay = false,
  muted = false,
  className,
  onEnded,
  onProgress,
  watermark,
  lessonId,
  title,
}: ModernVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Get Cloudinary URLs
  const resolvedCloudName = cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  // HLS URL for adaptive streaming (primary)
  const hlsUrl = resolvedCloudName && publicId
    ? `https://res.cloudinary.com/${resolvedCloudName}/video/upload/sp_hd/${publicId}.m3u8`
    : null;
  
  // MP4 URL as fallback
  const mp4Url = resolvedCloudName && publicId
    ? `https://res.cloudinary.com/${resolvedCloudName}/video/upload/q_auto/${publicId}.mp4`
    : null;

  // Poster URL
  const posterUrl = poster || (resolvedCloudName && publicId
    ? `https://res.cloudinary.com/${resolvedCloudName}/video/upload/so_0,w_1280,h_720,c_fill,q_auto/${publicId}.jpg`
    : undefined);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) {
      if (!hlsUrl) setError("No video source available");
      return;
    }

    console.log("🎬 Initializing video player for:", publicId);
    setIsLoading(true);
    setError(null);

    // Initialize HLS
    if (Hls.isSupported()) {
      console.log("✅ HLS.js supported - using adaptive streaming");
      
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
      });

      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        console.log(`📊 HLS manifest loaded: ${data.levels.length} quality levels`);
        data.levels.forEach((level, i) => {
          console.log(`  Level ${i}: ${level.height}p @ ${(level.bitrate / 1000000).toFixed(2)} Mbps`);
        });
        
        setIsLoading(false);
        setIsReady(true);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("❌ HLS error:", data);
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("Network error - attempting recovery");
              if (data.response?.code === 404) {
                // Video not ready yet, try fallback
                console.log("🔄 Video not found, trying MP4 fallback");
                setError("Video is still processing. Trying alternative...");
                if (mp4Url) {
                  video.src = mp4Url;
                  setIsReady(true);
                  setIsLoading(false);
                }
              } else {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("Media error - attempting recovery");
              hls.recoverMediaError();
              break;
            default:
              console.error("Fatal error - destroying HLS");
              setError("Unable to play video. Please try again later.");
              hls.destroy();
          }
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const level = hls.levels[data.level];
        console.log(`📺 Quality switched to: ${level.height}p`);
      });

    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      console.log("🍎 Native HLS supported (Safari)");
      video.src = hlsUrl;
      
      const handleLoadedMetadata = () => {
        setIsLoading(false);
        setIsReady(true);
      };
      
      const handleError = () => {
        console.error("❌ Native HLS error, trying MP4 fallback");
        if (mp4Url) {
          video.src = mp4Url;
          setIsReady(true);
        } else {
          setError("Unable to load video");
        }
        setIsLoading(false);
      };
      
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("error", handleError);
      
      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("error", handleError);
      };
    } else {
      // No HLS support, use MP4
      console.log("⚠️ No HLS support, using MP4 fallback");
      if (mp4Url) {
        video.src = mp4Url;
        setIsReady(true);
        setIsLoading(false);
      } else {
        setError("Your browser doesn't support video playback");
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl, mp4Url, publicId]);

  // Initialize Plyr player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    console.log("🎮 Initializing Plyr controls");

    const player = new Plyr(video, {
      controls: [
        "play-large",
        "play",
        "progress",
        "current-time",
        "duration",
        "mute",
        "volume",
        "settings",
        "pip",
        "fullscreen",
      ],
      settings: ["quality", "speed"],
      quality: {
        default: 576,
        options: [1080, 720, 576, 480, 360],
        forced: false,
        onChange: (quality: any) => {
          console.log("Quality changed to:", quality);
        },
      } as any,
      speed: {
        selected: 1,
        options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
      },
      tooltips: { controls: true, seek: true },
      keyboard: { focused: true, global: false },
      fullscreen: { enabled: true, fallback: true, iosNative: true },
      ratio: "16:9",
      autoplay: autoPlay,
      muted: muted,
    });

    playerRef.current = player;

    // Event listeners
    player.on("ended", () => {
      console.log("📺 Video ended");
      onEnded?.();
    });

    player.on("timeupdate", () => {
      if (player.duration > 0) {
        const progressPercent = (player.currentTime / player.duration) * 100;
        onProgress?.(progressPercent);
      }
    });

    player.on("play", () => {
      console.log("▶️ Video playing");
    });

    player.on("pause", () => {
      console.log("⏸️ Video paused");
    });

    player.on("error", (event: any) => {
      console.error("❌ Plyr error:", event);
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isReady, autoPlay, muted, onEnded, onProgress]);

  // Loading State
  if (isLoading && !error) {
    return (
      <Card className={cn("relative aspect-video flex items-center justify-center bg-black", className)}>
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div className="text-white">
            <p className="font-medium">Loading video...</p>
            {title && <p className="text-sm text-gray-400 mt-1">{title}</p>}
          </div>
        </div>
      </Card>
    );
  }

  // Error State
  if (error) {
    return (
      <Card className={cn("relative aspect-video flex items-center justify-center bg-black", className)}>
        <div className="text-center space-y-4 p-8">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div className="text-white">
            <p className="font-medium">Unable to load video</p>
            <p className="text-sm text-gray-400 mt-2">{error}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <video
        ref={videoRef}
        className="w-full"
        poster={posterUrl}
        playsInline
        crossOrigin="anonymous"
      />
      
      {/* Watermark Overlay */}
      {watermark && (
        <div className="absolute top-4 right-4 z-50 pointer-events-none">
          {watermark}
        </div>
      )}
    </div>
  );
}
