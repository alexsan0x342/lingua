"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "@/hooks/use-session";

interface VideoWatermarkProps {
  className?: string;
}

export function VideoWatermark({ className = "" }: VideoWatermarkProps) {
  const { session } = useSession();
  const [position, setPosition] = useState({ x: 10, y: 10 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkBackground, setIsDarkBackground] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Detect if video background is light or dark at watermark position
  useEffect(() => {
    if (!isFullscreen) return;

    const checkVideoBackground = () => {
      try {
        const video = document.querySelector('video');
        if (!video || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Sample a small area where the watermark will be
        canvas.width = 10;
        canvas.height = 10;
        
        ctx.drawImage(video, position.x, position.y, 10, 10, 0, 0, 10, 10);
        const imageData = ctx.getImageData(0, 0, 10, 10).data;
        
        // Calculate average brightness
        let totalBrightness = 0;
        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          totalBrightness += (r + g + b) / 3;
        }
        const avgBrightness = totalBrightness / (imageData.length / 4);
        
        // If average brightness > 128, it's a light background
        setIsDarkBackground(avgBrightness < 128);
      } catch (error) {
        // If we can't detect, default to dark
        setIsDarkBackground(true);
      }
    };

    const interval = setInterval(checkVideoBackground, 1000);
    checkVideoBackground();

    return () => clearInterval(interval);
  }, [position, isFullscreen]);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Function to get container dimensions based on fullscreen state
    const getContainerDimensions = () => {
      if (isFullscreen) {
        return {
          maxX: window.innerWidth - 200,
          maxY: window.innerHeight - 50
        };
      } else if (containerRef.current) {
        const container = containerRef.current.parentElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          return {
            maxX: containerRect.width - 200,
            maxY: containerRect.height - 50
          };
        }
      }
      return { maxX: 250, maxY: 150 };
    };

    // Move watermark every 3-5 seconds within the video player bounds
    const moveWatermark = () => {
      const { maxX, maxY } = getContainerDimensions();
      
      setPosition({
        x: Math.random() * Math.max(maxX, 10),
        y: Math.random() * Math.max(maxY, 10)
      });
    };

    const interval = setInterval(moveWatermark, 4000 + Math.random() * 3000); // Move every 4-7 seconds
    
    // Move immediately on mount or fullscreen change
    setTimeout(moveWatermark, 100); // Initial movement after short delay
    
    // Also move again after 2 seconds to show it's working
    setTimeout(moveWatermark, 2000);

    return () => clearInterval(interval);
  }, [session, isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isNowFullscreen);
      console.log('Fullscreen changed:', isNowFullscreen); // Debug log
    };

    // Initial check
    handleFullscreenChange();

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Also listen for resize events in case dimensions change
    window.addEventListener('resize', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('resize', handleFullscreenChange);
    };
  }, []);

  // Don't render if no user
  if (!session?.user?.id) return null;

  // Hidden canvas for background detection
  const hiddenCanvas = (
    <canvas 
      ref={canvasRef} 
      style={{ display: 'none' }} 
    />
  );

  const watermarkElement = (
    <>
      {hiddenCanvas}
      <div
        ref={containerRef}
        className={`${isFullscreen ? 'fixed' : 'absolute'} pointer-events-none select-none transition-all duration-1000 ease-in-out ${className}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: isFullscreen ? 2147483647 : 40, // Maximum z-index for fullscreen
          transform: `rotate(${-5 + Math.random() * 10}deg)`,
          willChange: 'transform, left, top',
          imageRendering: 'crisp-edges',
        }}
      >
        {/* Dual-color watermark for maximum visibility on any background */}
        {/* Always renders at native resolution regardless of video quality */}
        <div className="relative" style={{ 
          imageRendering: 'pixelated',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)', // Force GPU acceleration
        }}>
          {/* White text with black outline for dark backgrounds */}
          <div 
            className={`transition-opacity duration-500 ${
              isDarkBackground ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              padding: '7px 12px',
              borderRadius: '7px',
              backgroundColor: 'rgba(0, 0, 0, 0.78)',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '800',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              letterSpacing: '0.1em',
              lineHeight: '1',
              textShadow: `
                -1.5px -1.5px 0 #000,
                1.5px -1.5px 0 #000,
                -1.5px 1.5px 0 #000,
                1.5px 1.5px 0 #000,
                0 0 10px rgba(255, 255, 255, 0.9),
                0 0 15px rgba(255, 255, 255, 0.5)
              `,
              border: '2.5px solid rgba(255, 255, 255, 0.55)',
              boxShadow: `
                0 3px 10px rgba(0, 0, 0, 0.65),
                inset 0 0 18px rgba(255, 255, 255, 0.12)
              `,
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
              WebkitTransform: 'translateZ(0) scale(1)',
              transform: 'translateZ(0) scale(1)',
              imageRendering: 'crisp-edges',
            }}
          >
            ID: {session.user.id.slice(-8).toUpperCase()}
          </div>
          {/* Black text with white outline for light backgrounds */}
          <div 
            className={`absolute inset-0 transition-opacity duration-500 ${
              isDarkBackground ? 'opacity-0' : 'opacity-100'
            }`}
            style={{
              padding: '7px 12px',
              borderRadius: '7px',
              backgroundColor: 'rgba(255, 255, 255, 0.88)',
              color: '#000000',
              fontSize: '13px',
              fontWeight: '800',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              letterSpacing: '0.1em',
              lineHeight: '1',
              textShadow: `
                -1.5px -1.5px 0 #fff,
                1.5px -1.5px 0 #fff,
                -1.5px 1.5px 0 #fff,
                1.5px 1.5px 0 #fff,
                0 0 10px rgba(0, 0, 0, 0.9),
                0 0 15px rgba(0, 0, 0, 0.5)
              `,
              border: '2.5px solid rgba(0, 0, 0, 0.45)',
              boxShadow: `
                0 3px 10px rgba(0, 0, 0, 0.45),
                inset 0 0 18px rgba(0, 0, 0, 0.06)
              `,
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
              WebkitTransform: 'translateZ(0) scale(1)',
              transform: 'translateZ(0) scale(1)',
              imageRendering: 'crisp-edges',
            }}
          >
            ID: {session.user.id.slice(-8).toUpperCase()}
          </div>
        </div>
      </div>
    </>
  );

  // When fullscreen, always render as portal to body with maximum z-index
  // This ensures watermark appears over fullscreen iframes and video elements
  if (isFullscreen && typeof window !== 'undefined') {
    return createPortal(watermarkElement, document.body);
  }

  // Normal render within video container
  return watermarkElement;
}