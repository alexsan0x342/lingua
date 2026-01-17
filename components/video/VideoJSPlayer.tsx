"use client";

import { useEffect, useRef, useState } from "react";
import { Settings, Gauge, Check, AlertCircle } from "lucide-react";
import { VideoWatermark } from "./VideoWatermark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VideoJSPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  onReady?: () => void;
  autoPlay?: boolean;
  muted?: boolean;
}

interface QualityLevel {
  height: number;
  bitrate?: number;
  index: number;
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function VideoJSPlayer({
  src,
  poster,
  className = "",
  onReady,
  autoPlay = false,
  muted = false,
}: VideoJSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);

  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number | "auto">("auto");
  const [currentSpeed, setCurrentSpeed] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || src.trim() === "") {
      setHasError(true);
      setErrorMessage("Missing video source URL");
      return;
    }

    let destroyed = false;

    const setup = async () => {
      try {
        console.log("Initializing HLS player with src:", src);
        // If the browser can play HLS natively (Safari/iOS), use native playback
        const canPlayNative = video.canPlayType("application/vnd.apple.mpegurl");
        if (canPlayNative) {
          video.src = src;
          video.autoplay = autoPlay;
          video.muted = muted;
          video.playsInline = true;
          video.load();
          video.onloadedmetadata = () => {
            if (destroyed) return;
            setIsReady(true);
            onReady?.();
          };
          video.onerror = () => {
            if (destroyed) return;
            setHasError(true);
            setErrorMessage("Failed to load video");
          };
          return;
        }

        const Hls = (await import("hls.js")).default;
        if (!Hls.isSupported()) {
          setHasError(true);
          setErrorMessage("HLS not supported in this browser");
          return;
        }

        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (destroyed) return;
          console.error("HLS error", data);
          if (data?.response?.code === 404) {
            setHasError(true);
            setErrorMessage("Stream not found (404)");
            hls.destroy();
            return;
          }
          if (data?.fatal) {
            setHasError(true);
            setErrorMessage("Failed to load video stream");
            hls.destroy();
          }
        });

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          if (destroyed) return;
          const levels: QualityLevel[] = (data.levels || []).map((lvl: any, idx: number) => ({
            height: lvl.height || 0,
            bitrate: lvl.bitrate,
            index: idx,
          }));
          // Sort by height desc
          levels.sort((a, b) => b.height - a.height);
          setQualityLevels(levels);
          setIsReady(true);
          onReady?.();
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        video.autoplay = autoPlay;
        video.muted = muted;
        video.playsInline = true;
      } catch (err) {
        console.error("Failed to init HLS", err);
        setHasError(true);
        setErrorMessage("Failed to initialize player");
      }
    };

    setup();

    return () => {
      destroyed = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay, muted, onReady]);

  const handleQualityChange = (height: number | "auto") => {
    setSelectedQuality(height);
    const hls = hlsRef.current;
    if (!hls) return;

    if (height === "auto") {
      hls.currentLevel = -1; // auto
      return;
    }

    const target = qualityLevels.find((q) => q.height === height);
    if (target) {
      hls.currentLevel = target.index;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setCurrentSpeed(speed);
    const video = videoRef.current;
    if (video) {
      video.playbackRate = speed;
    }
  };

  if (hasError) {
    return (
      <div className={`relative w-full bg-black rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center text-white flex flex-col items-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
            <p className="text-lg font-medium mb-1">Unable to play video</p>
            <p className="text-sm text-gray-400">{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          controls
          poster={poster}
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
          playsInline
          muted={muted}
          autoPlay={autoPlay}
        />

        {/* Custom Controls Overlay - Visible on hover or focus */}
        {isReady && (
          <div className="absolute top-3 right-3 flex gap-2 z-[100] transition-opacity duration-200 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
            {/* Quality Selector */}
            {qualityLevels.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 bg-black/70 hover:bg-black/90 text-white border border-white/15 backdrop-blur-sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {selectedQuality === "auto" ? "Auto" : `${selectedQuality}p`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-black/90 border-white/15 text-white">
                  <DropdownMenuLabel>Quality</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => handleQualityChange("auto")}
                    className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>Auto</span>
                      {selectedQuality === "auto" && <Check className="h-4 w-4" />}
                    </div>
                  </DropdownMenuItem>
                  {qualityLevels.map((level) => (
                    <DropdownMenuItem
                      key={level.index}
                      onClick={() => handleQualityChange(level.height)}
                      className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{level.height}p</span>
                        {selectedQuality === level.height && <Check className="h-4 w-4" />}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Speed Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 bg-black/70 hover:bg-black/90 text-white border border-white/15 backdrop-blur-sm"
                >
                  <Gauge className="h-4 w-4 mr-2" />
                  {currentSpeed}x
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-black/90 border-white/15 text-white">
                <DropdownMenuLabel>Speed</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {SPEED_OPTIONS.map((speed) => (
                  <DropdownMenuItem
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>
                        {speed}x {speed === 1 && "(Normal)"}
                      </span>
                      {currentSpeed === speed && <Check className="h-4 w-4" />}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <VideoWatermark />
      </div>
    </div>
  );
}
