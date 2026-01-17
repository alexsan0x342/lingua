"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, BookIcon } from "lucide-react";
import { BunnyVideoPlayer } from "@/components/video/BunnyVideoPlayer";
import { VideoWatermark } from "@/components/video/VideoWatermark";
import { useSession } from "@/hooks/use-session";
import { useTranslations } from "@/components/general/I18nProvider";

interface RecordingViewerProps {
  recordingUrl: string;
  lessonTitle: string;
}

export function RecordingViewer({
  recordingUrl,
  lessonTitle,
}: RecordingViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { session } = useSession();
  const t = useTranslations();

  // Return null if recordingUrl is empty, null, or undefined
  if (!recordingUrl || recordingUrl.trim() === "") {
    return null;
  }

  // Trim whitespace
  const videoKey = recordingUrl.trim();

  // Determine if this is a local video file (starts with /images/ or is a direct file path)
  const isLocalVideo =
    videoKey?.startsWith("/images/") ||
    videoKey?.startsWith("/uploads/") ||
    videoKey?.endsWith(".mp4");

  // Check if it's a Bunny.net video ID (UUID format)
  const isBunnyVideo =
    videoKey &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      videoKey,
    );

  // Render the player in dialog
  const renderPlayer = () => {
    // No video
    if (!videoKey) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center p-4">
          <BookIcon className="size-12 sm:size-16 text-primary mx-auto mb-3 sm:mb-4" />
          <p className="text-muted-foreground text-sm sm:text-base text-center">
            {t("recording.noVideo")}
          </p>
        </div>
      );
    }

    // Local video files (for backward compatibility)
    if (isLocalVideo) {
      return (
        <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
          <VideoWatermark />
          <video
            className="w-full h-full object-cover"
            controls
            playsInline
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
          >
            <source src={videoKey} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // If it's a Bunny.net video, use BunnyVideoPlayer
    if (isBunnyVideo) {
      return (
        <div className="relative">
          <BunnyVideoPlayer
            videoId={videoKey}
            autoplay={false}
            controls={true}
            className="aspect-video w-full"
            userId={session?.user?.id}
          />
        </div>
      );
    }

    // Otherwise, show message that video needs to be re-uploaded or is processing
    return (
      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center p-4">
        <BookIcon className="size-12 sm:size-16 text-primary mx-auto mb-3 sm:mb-4" />
        <p className="text-muted-foreground text-center text-sm sm:text-base font-medium">
          {t("recording.processing")}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2 text-center px-2">
          {t("recording.processingMessage")}
        </p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="text-xs sm:text-sm">
          <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="hidden xs:inline">{t("recording.watchLesson")}</span>
          <span className="xs:hidden">{t("recording.watch")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-4xl w-[95vw] sm:w-full"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-lg line-clamp-1 pr-8">
            {lessonTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">{renderPlayer()}</div>
      </DialogContent>
    </Dialog>
  );
}
