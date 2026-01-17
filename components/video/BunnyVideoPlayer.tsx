"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2, AlertCircle, Play } from "lucide-react";
import Image from "next/image";

interface BunnyVideoPlayerProps {
  videoId: string;
  cdnHostname?: string;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
  poster?: string; // Custom thumbnail URL
  userId?: string; // User ID for watermark
}

export function BunnyVideoPlayer({
  videoId,
  cdnHostname,
  autoplay = false,
  controls = true,
  className = "",
  poster,
  userId,
}: BunnyVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(autoplay); // Only show video iframe immediately if autoplay
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 10, y: 10 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hostname =
    cdnHostname || process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME || "";
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID || "";

  console.log("🎬 BunnyVideoPlayer - videoId:", videoId);
  console.log("🌐 BunnyVideoPlayer - hostname:", hostname);
  console.log("📚 BunnyVideoPlayer - libraryId:", libraryId);
  console.log("👤 BunnyVideoPlayer - userId:", userId);
  console.log(
    "💧 BunnyVideoPlayer - watermarkText:",
    userId ? `ID: ${userId.slice(-8).toUpperCase()}` : "none",
  );
  if (poster) {
    console.log("🖼️ BunnyVideoPlayer - poster:", poster);
  }

  if (!videoId) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-900 text-white p-8 rounded-lg ${className}`}
      >
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg font-medium mb-2">Video Error</p>
          <p className="text-sm text-gray-400">Missing video ID</p>
        </div>
      </div>
    );
  }

  if (!hostname) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-900 text-white p-8 rounded-lg ${className}`}
      >
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg font-medium mb-2">Video Error</p>
          <p className="text-sm text-gray-400">
            Missing CDN hostname configuration
          </p>
        </div>
      </div>
    );
  }

  if (!libraryId) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-900 text-white p-8 rounded-lg ${className}`}
      >
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg font-medium mb-2">Video Error</p>
          <p className="text-sm text-gray-400">
            Missing Bunny Stream library ID configuration
          </p>
        </div>
      </div>
    );
  }

  // Use Bunny.net Stream's official iframe embed player with watermark
  const watermarkText = userId ? `ID: ${userId.slice(-8).toUpperCase()}` : "";
  let embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=${showVideo}&preload=true`;

  // Add watermark as captions overlay if userId is provided
  if (watermarkText) {
    // Inject custom CSS and overlay via iframe postMessage after load
    embedUrl += "&time=0"; // Add parameter to ensure URL changes
  }

  // Move watermark position every 4-7 seconds
  useEffect(() => {
    if (!userId || !showVideo) return;

    const moveWatermark = () => {
      if (isFullscreen) {
        // Fullscreen dimensions
        setWatermarkPosition({
          x: Math.random() * (window.innerWidth - 200),
          y: Math.random() * (window.innerHeight - 50),
        });
      } else {
        // Normal dimensions
        const container = iframeRef.current?.parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          setWatermarkPosition({
            x: Math.random() * Math.max(rect.width - 200, 10),
            y: Math.random() * Math.max(rect.height - 50, 10),
          });
        }
      }
    };

    moveWatermark(); // Initial position
    const interval = setInterval(moveWatermark, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [userId, showVideo, isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      console.log("🖥️ Fullscreen changed:", isNowFullscreen);
      setIsFullscreen(isNowFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange,
      );
    };
  }, []);

  const handlePlayClick = () => {
    setShowVideo(true);
    setIsLoading(true);
  };

  // Show custom thumbnail with play button if we have a poster and video hasn't started
  if (poster && !showVideo) {
    return (
      <div
        className={`relative bg-black rounded-lg overflow-hidden cursor-pointer group ${className}`}
        onClick={handlePlayClick}
      >
        <Image
          src={poster}
          alt="Video thumbnail"
          fill
          className="object-cover"
          unoptimized={
            poster.includes("cdn.lingua-ly.com") ||
            poster.includes("cdn.novally.tech")
          }
          priority
        />
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <div className="w-20 h-20 rounded-full bg-primary/90 group-hover:bg-primary flex items-center justify-center transition-colors shadow-lg">
            <Play className="w-10 h-10 text-white fill-white ml-1" />
          </div>
        </div>
      </div>
    );
  }

  // Render watermark
  const renderWatermark = () => {
    if (!userId || !showVideo || !watermarkText) {
      console.log("❌ Watermark not rendering:", {
        userId: !!userId,
        showVideo,
        watermarkText,
      });
      return null;
    }

    console.log("✅ Rendering watermark:", {
      watermarkText,
      isFullscreen,
      position: watermarkPosition,
    });

    const watermark = (
      <div
        ref={overlayRef}
        className="pointer-events-none select-none"
        style={{
          position: isFullscreen ? "fixed" : "absolute",
          left: `${watermarkPosition.x}px`,
          top: `${watermarkPosition.y}px`,
          zIndex: isFullscreen ? 2147483647 : 9999,
          transform: `rotate(${-3 + Math.random() * 6}deg)`,
          transition: "all 1s ease-in-out",
        }}
      >
        <div
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            backgroundColor: "rgba(20, 58, 123, 0.85)",
            color: "#FFFFFF",
            fontSize: "14px",
            fontWeight: "900",
            fontFamily: "ui-monospace, monospace",
            letterSpacing: "0.12em",
            textShadow: `
              -2px -2px 0 #000,
              2px -2px 0 #000,
              -2px 2px 0 #000,
              2px 2px 0 #000,
              0 0 15px rgba(255, 255, 255, 1)
            `,
            border: "3px solid rgba(255, 255, 255, 0.7)",
            boxShadow:
              "0 4px 15px rgba(0, 0, 0, 0.8), 0 0 20px rgba(20, 58, 123, 0.5)",
            backdropFilter: "blur(2px)",
          }}
        >
          {watermarkText}
        </div>
      </div>
    );

    // Use portal when in fullscreen to render on top of everything
    if (isFullscreen && typeof window !== "undefined") {
      console.log("🔄 Using portal for fullscreen watermark");
      return createPortal(watermark, document.body);
    }

    return watermark;
  };

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
            <p className="text-white text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* Watermark overlay */}
      {renderWatermark()}

      <iframe
        ref={iframeRef}
        src={embedUrl}
        loading="lazy"
        style={{
          border: 0,
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: "100%",
        }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError("Failed to load video player");
          setIsLoading(false);
        }}
      />
    </div>
  );
}
