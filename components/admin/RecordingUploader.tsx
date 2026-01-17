"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Play, Trash2, CheckCircle2 } from "lucide-react";
import { BunnyVideoUploader } from "@/components/video/BunnyVideoUploader";
import { toast } from "sonner";
import { useTranslations } from "@/components/general/I18nProvider";

interface RecordingUploaderProps {
  lessonId: string;
  lessonTitle: string;
  currentRecordingUrl?: string;
  onRecordingUploaded: () => void;
}

export function RecordingUploader({
  lessonId,
  lessonTitle,
  currentRecordingUrl,
  onRecordingUploaded,
}: RecordingUploaderProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadedPlaybackId, setUploadedPlaybackId] = useState<string | null>(
    null,
  );

  const handleUploadComplete = (playbackId: string) => {
    console.log("Upload complete - Playback ID:", playbackId);
    setUploadedPlaybackId(playbackId);
  };

  const handleDeleteRecording = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this recording? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/live-lessons/recording", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lessonId }),
      });

      if (response.ok) {
        toast.success("Recording deleted successfully");
        setIsOpen(false);
        onRecordingUploaded();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete recording");
      }
    } catch (error) {
      console.error("Error deleting recording:", error);
      toast.error("Failed to delete recording");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveRecording = async () => {
    if (!uploadedPlaybackId) {
      toast.error("Please upload a video first");
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch("/api/live-lessons/recording", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId,
          recordingUrl: uploadedPlaybackId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Recording saved and notifications sent!`);
        setIsOpen(false);
        setUploadedPlaybackId(null);
        onRecordingUploaded();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save recording");
      }
    } catch (error) {
      console.error("Error saving recording:", error);
      toast.error("Failed to save recording");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {currentRecordingUrl ? (
          <Button
            variant="outline"
            size="sm"
            className="border-primary text-primary"
          >
            <Play className="h-4 w-4 mr-1" />
            {t("recording.updateRecording")}
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-1" />
            {t("recording.uploadRecording")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {currentRecordingUrl ? "Update" : "Upload"} Recording for "
            {lessonTitle}"
          </DialogTitle>
          <DialogDescription>
            Upload the recorded video from your live lesson. It will be
            processed through Bunny.net for optimal streaming.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {currentRecordingUrl && (
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Current recording
                  </p>
                  <p className="text-xs font-mono text-muted-foreground/70 truncate max-w-[280px]">
                    ID: {currentRecordingUrl}
                  </p>
                  <Button variant="outline" asChild size="sm">
                    <a
                      href={`https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID}/${currentRecordingUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      View Recording
                    </a>
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteRecording}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Upload New Recording</h4>
            <BunnyVideoUploader
              onChange={handleUploadComplete}
              value={uploadedPlaybackId || undefined}
              lessonId={lessonId}
              courseId=""
            />
          </div>

          {uploadedPlaybackId && (
            <Alert className="border-primary/20 bg-primary/5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                Video uploaded successfully! Click "Save Recording" to finalize.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRecording}
              disabled={!uploadedPlaybackId || isUploading}
            >
              {isUploading ? "Saving..." : "Save Recording"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
