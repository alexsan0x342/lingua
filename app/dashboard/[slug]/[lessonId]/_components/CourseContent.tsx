"use client";

import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { BunnyVideoPlayer } from "@/components/video/BunnyVideoPlayer";
import { VideoWatermark } from "@/components/video/VideoWatermark";
import { BookIcon, CheckCircle } from "lucide-react";
import { useTransition } from "react";
import { markLessonComplete } from "../actions";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/use-confetti";
import LessonAssignments from "./LessonAssignments";
import { useSession } from "@/hooks/use-session";
import { useTranslations } from "@/components/general/I18nProvider";

interface iAppProps {
  data: LessonContentType;
}

export function CourseContent({ data }: iAppProps) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const { triggerConfetti } = useConfetti();
  const { session } = useSession();

  function VideoPlayer({
    thumbnailKey,
    videoKey,
  }: {
    thumbnailKey: string;
    videoKey: string;
  }) {
    const thumbnailUrl = useConstructUrl(thumbnailKey);

    // Check if we have a valid playbackId for Mux videos
    const muxPlaybackId = data.playbackId;
    
    // Determine if this is a local video file (starts with /images/ or is a direct file path)
    const isLocalVideo = videoKey?.startsWith('/images/') || videoKey?.startsWith('/uploads/') || videoKey?.endsWith('.mp4');
    
    // Check if it's a Bunny.net video ID (UUID format)
    const isBunnyVideo = videoKey && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoKey);

    
    if (!videoKey && !muxPlaybackId) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
          <BookIcon className="size-16 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            This lesson does not have a video yet
          </p>
        </div>
      );
    }

    if (isLocalVideo) {
      // Handle local video files (for backward compatibility)
      return (
        <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
          <VideoWatermark />
          <video
            className="w-full h-full object-cover"
            controls
            poster={thumbnailUrl}
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
            poster={thumbnailUrl || undefined}
            userId={session?.user?.id}
          />
        </div>
      );
    }

    // Otherwise, show message that video needs to be re-uploaded
    return (
      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center p-6">
        <BookIcon className="size-16 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground text-center">
          This video uses an older format. Please contact your instructor to re-upload this lesson's video.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Video ID: {videoKey}
        </p>
      </div>
    );
  }

  function onSubmit() {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        markLessonComplete(data.id, data.Chapter.Course.slug)
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        triggerConfetti();
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }
  return (
    <div className="flex flex-col h-full bg-background pl-6">
      <VideoPlayer
        thumbnailKey={data.thumbnailKey ?? ""}
        videoKey={data.videoKey ?? ""}
      />

      <div className="py-4 border-b">
        {data.lessonProgress.length > 0 ? (
          <Button
            variant="outline"
            className="bg-primary/10 text-primary hover:text-primary/80"
          >
            <CheckCircle className="size-4 mr-2 text-primary" />
            {t("lessons.completed")}
          </Button>
        ) : (
          <Button variant="outline" onClick={onSubmit} disabled={pending}>
            <CheckCircle className="size-4 mr-2 text-primary" />
            {t("lessons.markAsComplete")}
          </Button>
        )}
      </div>

      <div className="space-y-3 pt-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {data.title}
        </h1>

        {data.description && (
          <RenderDescription json={JSON.parse(data.description)} />
        )}
        
        {data.resources && data.resources.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">📚 {t("lessons.resources")}</h3>
            <div className="grid gap-3">
              {data.resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {resource.fileType === "link" ? "🔗" : "📄"}
                    </div>
                    <div>
                      <h4 className="font-medium">{resource.title}</h4>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground">
                          {resource.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {t("lessons.type")}: {resource.type || resource.fileType}
                        {resource.isRequired && (
                          <span className="ml-2 text-destructive">• {t("lessons.required")}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {resource.fileType === "link" && resource.fileKey ? (
                      <a
                        href={resource.fileKey}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                      >
                        🔗 {t("lessons.visitLink")}
                      </a>
                    ) : resource.fileKey ? (
                      <a
                        href={resource.fileKey}
                        download={resource.fileName}
                        className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                      >
                        📥 Download
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.assignments && data.assignments.length > 0 && (
          <LessonAssignments 
            assignments={data.assignments} 
            lessonId={data.id} 
            courseId={data.Chapter.courseId}
          />
        )}
      </div>
    </div>
  );
}
