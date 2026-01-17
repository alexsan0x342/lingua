"use client";

import { useState } from "react";
import { BunnyVideoUploader } from "./BunnyVideoUploader";
import { BunnyVideoPlayer } from "./BunnyVideoPlayer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VideoManagerProps {
  lessonId?: string;
  courseId?: string;
  initialVideoId?: string;
  onVideoChange?: (publicId: string) => void;
  className?: string;
}

export function VideoManager({
  lessonId,
  courseId,
  initialVideoId,
  onVideoChange,
  className,
}: VideoManagerProps) {
  const [videoPublicId, setVideoPublicId] = useState<string | null>(initialVideoId || null);

  const handleVideoChange = (videoId: string) => {
    setVideoPublicId(videoId);
    onVideoChange?.(videoId);
  };

  return (
    <div className={className}>
      {!videoPublicId ? (
        /* Upload Mode */
        <Card>
          <CardHeader>
            <CardTitle>Upload Video</CardTitle>
            <CardDescription>
              Upload your video to Bunny.net for adaptive HLS streaming with automatic quality selection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BunnyVideoUploader
              lessonId={lessonId}
              courseId={courseId || ""}
              value={videoPublicId || undefined}
              onChange={handleVideoChange}
            />
          </CardContent>
        </Card>
      ) : (
        /* Playback Mode */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Video Preview</h3>
              <p className="text-sm text-muted-foreground">
                ID: {videoPublicId}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">HLS Streaming</Badge>
              <Badge variant="outline">Adaptive Quality</Badge>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <BunnyVideoPlayer
                videoId={videoPublicId}
                autoplay={false}
                controls={true}
                className="aspect-video w-full"
              />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <button
              onClick={() => setVideoPublicId(null)}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Upload Different Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
