"use client";

import { BookIcon, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { SecureVideoPlayer } from "./SecureVideoPlayer";
import { useConstructUrl } from "@/hooks/use-construct-url";

interface BulletproofVideoPlayerProps {
  publicId?: string; // Cloudinary public ID
  lessonId: string; // Required for access control
  playbackId?: string; // Legacy Mux support
  videoKey?: string;
  thumbnailKey?: string;
}

export function BulletproofVideoPlayer({ 
  publicId, 
  lessonId,
  playbackId, 
  videoKey, 
  thumbnailKey 
}: BulletproofVideoPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const [hasIDM, setHasIDM] = useState(false);
  
  // Construct proper URL for thumbnail
  const thumbnailUrl = useConstructUrl(thumbnailKey || "");

  // Detect IDM browser extension
  useEffect(() => {
    const detectIDM = () => {
      // Check for IDM extension indicators
      const hasIDMExtension = !!(
        (window as any).IDMExtension ||
        (window as any).IDM ||
        document.querySelector('[id*="IDM"]') ||
        document.querySelector('[class*="IDM"]') ||
        document.querySelector('[id*="idmmenu"]') ||
        document.querySelector('[class*="idmmenu"]') ||
        // Check for IDM iframe
        Array.from(document.querySelectorAll('iframe')).some(
          (iframe) => iframe.src?.includes('idm') || iframe.id?.includes('IDM')
        )
      );

      if (hasIDMExtension) {
        setHasIDM(true);
      }
    };

    // Check immediately
    detectIDM();
    
    // Check again after a short delay (for extensions that load later)
    const timeout1 = setTimeout(detectIDM, 1000);
    const timeout2 = setTimeout(detectIDM, 3000);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, []);

  // Prevent video downloads and DevTools shortcuts
  useEffect(() => {
    // Suppress Mux/HLS error logs that clutter the console
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // Filter out known Mux/HLS errors that we handle gracefully
      const errorString = args.join(' ');
      if (
        errorString.includes('getErrorFromHlsErrorData') ||
        errorString.includes('MediaError: The URL or playback-id was invalid') ||
        errorString.includes('[mux-player') ||
        errorString.includes('Failed to update lesson with playback ID')
      ) {
        // Silently ignore these errors as they're handled in the UI
        return;
      }
      // Pass through other errors
      originalConsoleError.apply(console, args);
    };

    const preventDownload = (e: KeyboardEvent) => {
      // Prevent Ctrl+S, Ctrl+Shift+I, F12, Ctrl+U
      if (
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Hide video source from IDM and other download managers
    const hideVideoElements = () => {
      // Remove download attributes from all video and source elements
      const videos = document.querySelectorAll('video, source');
      videos.forEach((video) => {
        video.removeAttribute('src');
        video.removeAttribute('download');
        video.setAttribute('controlsList', 'nodownload');
      });
    };

    // Disable IDM integration
    const disableIDM = () => {
      // Prevent IDM from detecting video elements
      if (typeof window !== 'undefined') {
        (window as any).stop_flash_download = true;
        (window as any).stop_all = true;
      }
    };

    document.addEventListener('keydown', preventDownload);
    
    // Run periodically to prevent IDM detection
    const interval = setInterval(() => {
      hideVideoElements();
      disableIDM();
    }, 1000);

    hideVideoElements();
    disableIDM();

    return () => {
      // Restore original console.error
      console.error = originalConsoleError;
      document.removeEventListener('keydown', preventDownload);
      clearInterval(interval);
    };
  }, []);

  // Show IDM warning if detected
  if (hasIDM) {
    return (
      <div className="aspect-video bg-destructive/10 rounded-lg flex flex-col items-center justify-center p-8 border-2 border-destructive">
        <AlertCircle className="size-16 text-destructive mx-auto mb-4" />
        <h3 className="text-xl font-bold text-destructive mb-2">
          Download Manager Detected
        </h3>
        <p className="text-center text-muted-foreground mb-4 max-w-md">
          We've detected that you have IDM (Internet Download Manager) or a similar download extension enabled. 
          This interferes with our video player security.
        </p>
        <p className="text-center font-semibold text-foreground mb-4">
          Please disable or remove the extension to watch videos.
        </p>
        <div className="bg-muted p-4 rounded-lg text-sm text-left max-w-md">
          <p className="font-semibold mb-2">How to disable:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Click on the IDM icon in your browser toolbar</li>
            <li>Select "Disable IDM integration" or "Turn off"</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      </div>
    );
  }

  // Use Cloudinary if publicId is provided
  const derivedPublicId = publicId || videoKey || playbackId;

  if (derivedPublicId) {
    return (
      <SecureVideoPlayer
        publicId={derivedPublicId}
        lessonId={lessonId}
        thumbnailUrl={useConstructUrl(thumbnailKey || "")}
        autoPlay={false}
        muted={false}
      />
    );
  }

  // No video
  return (
    <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
      <BookIcon className="size-16 text-primary mx-auto mb-4" />
      <p className="text-muted-foreground">
        This lesson does not have a video yet
      </p>
    </div>
  );
}
