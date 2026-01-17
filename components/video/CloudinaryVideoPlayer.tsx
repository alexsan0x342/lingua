"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Cloudinary video player types
interface CloudinaryPlayer {
  source: (publicId: string, options?: any) => void;
  play: () => Promise<void>;
  pause: () => void;
  dispose: () => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  currentTime: () => number;
  duration: () => number;
}

interface CloudinaryVideoPlayerProps {
  publicId: string;
  cloudName?: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
  onEnded?: () => void;
  onProgress?: (progress: number) => void;
  watermark?: React.ReactNode;
  title?: string;
}

export function CloudinaryVideoPlayer({
  publicId,
  cloudName,
  poster,
  autoPlay = false,
  muted = false,
  className,
  onEnded,
  onProgress,
  watermark,
  title,
}: CloudinaryVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<CloudinaryPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  const resolvedCloudName = cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  // Load Cloudinary player scripts
  useEffect(() => {
    // Check if already loaded
    if ((window as any).cloudinary?.videoPlayer) {
      setScriptsLoaded(true);
      return;
    }

    console.log("📦 Loading Cloudinary video player scripts...");

    // Load CSS
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "https://unpkg.com/cloudinary-video-player@3.6.2/dist/cld-video-player.min.css";
    document.head.appendChild(cssLink);

    // Load JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/cloudinary-video-player@3.6.2/dist/cld-video-player.min.js";
    script.async = true;
    
    script.onload = () => {
      console.log("✅ Cloudinary player loaded");
      setScriptsLoaded(true);
    };
    
    script.onerror = () => {
      console.error("❌ Failed to load Cloudinary player");
      setError("Failed to load video player. Please refresh the page.");
    };
    
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (cssLink.parentNode) cssLink.parentNode.removeChild(cssLink);
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  // Initialize player
  useEffect(() => {
    if (!scriptsLoaded || !videoRef.current || !resolvedCloudName || !publicId) {
      if (!resolvedCloudName) {
        setError("Cloudinary configuration missing");
      }
      return;
    }

    console.log("🎬 Initializing Cloudinary player:", publicId);
    setIsLoading(true);
    setError(null);

    try {
      // Initialize Cloudinary player
      const cloudinary = (window as any).cloudinary;
      if (!cloudinary || !cloudinary.videoPlayer) {
        throw new Error("Cloudinary player not loaded");
      }

      const player = cloudinary.videoPlayer(videoRef.current, {
        cloud_name: resolvedCloudName,
        secure: true,
        controls: true,
        fluid: true,
        autoplay: autoPlay,
        muted: muted,
        
        // Quality selector
        sourceTypes: ["hls", "dash", "mp4"],
        
        // Adaptive streaming profiles
        transformation: [
          { streaming_profile: "hd", flags: "streaming_attachment" }
        ],
        
        // UI Configuration
        bigPlayButton: true,
        posterOptions: {
          transformation: {
            width: 1280,
            height: 720,
            crop: "fill",
            quality: "auto",
            fetch_format: "auto",
          },
        },
        
        // Colors
        colors: {
          accent: "#3b82f6",
          base: "#000000",
          text: "#ffffff",
        },
        
        // Logo/watermark
        logoImageUrl: "",
        logoOnclickUrl: "",
        
        // Controls
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        showJumpControls: true,
        seekThumbnails: true,
        
        // Analytics
        analytics: false,
      });

      playerRef.current = player;

      // Set video source
      player.source(publicId, {
        sourceTypes: ["hls", "dash", "mp4"],
        transformation: [
          { streaming_profile: "hd" }
        ],
      });

      // Event listeners
      player.on("loadedmetadata", () => {
        console.log("📊 Video metadata loaded");
        setIsLoading(false);
      });

      player.on("play", () => {
        console.log("▶️ Video playing");
      });

      player.on("pause", () => {
        console.log("⏸️ Video paused");
      });

      player.on("ended", () => {
        console.log("✅ Video ended");
        onEnded?.();
      });

      player.on("timeupdate", () => {
        if (player.duration() > 0) {
          const progressPercent = (player.currentTime() / player.duration()) * 100;
          onProgress?.(progressPercent);
        }
      });

      player.on("error", (error: any) => {
        console.error("❌ Cloudinary player error:", error);
        setError("Error loading video. The video may still be processing.");
        setIsLoading(false);
      });

    } catch (err) {
      console.error("❌ Failed to initialize player:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize video player");
      setIsLoading(false);
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (e) {
          console.warn("Error disposing player:", e);
        }
        playerRef.current = null;
      }
    };
  }, [scriptsLoaded, publicId, resolvedCloudName, autoPlay, muted, onEnded, onProgress]);

  // Loading State
  if (!scriptsLoaded || (isLoading && !error)) {
    return (
      <Card className={cn("relative aspect-video flex items-center justify-center bg-black", className)}>
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div className="text-white">
            <p className="font-medium">
              {!scriptsLoaded ? "Loading player..." : "Loading video..."}
            </p>
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
    <div className={cn("relative", className)}>
      <video
        ref={videoRef}
        className="cld-video-player w-full"
        poster={poster}
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
