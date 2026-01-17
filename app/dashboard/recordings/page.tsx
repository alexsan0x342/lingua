"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Calendar,
  Clock,
  Play,
  FileVideo,
  ExternalLink,
  ChevronDown,
  Folder,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/components/general/I18nProvider";
import { useSession } from "@/hooks/use-session";
import { Skeleton } from "@/components/ui/skeleton";
import { BunnyVideoPlayer } from "@/components/video/BunnyVideoPlayer";
import { VideoWatermark } from "@/components/video/VideoWatermark";

interface Recording {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  recordingUrl?: string;
  course?: {
    id: string;
    title: string;
    slug: string;
  };
}

export default function RecordingsPage() {
  const t = useTranslations();
  const { session } = useSession();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(
    null,
  );
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRecordings();
  }, []);

  const toggleFolder = (key: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Auto-open all folders when recordings load
  useEffect(() => {
    if (recordings.length > 0) {
      const allKeys = new Set<string>();
      recordings.forEach((recording) => {
        const courseTitle = recording.course?.title || "Uncategorized";
        const courseSlug = recording.course?.slug || "other";
        allKeys.add(`${courseSlug}::${courseTitle}`);
      });
      setOpenFolders(allKeys);
    }
  }, [recordings]);

  const fetchRecordings = async () => {
    try {
      const response = await fetch("/api/user/recordings");
      if (response.ok) {
        const data = await response.json();
        setRecordings(data);
      }
    } catch (error) {
      console.error("Error fetching recordings:", error);
      toast.error("Failed to fetch recordings");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const groupedRecordings = recordings.reduce(
    (acc, recording) => {
      const courseTitle = recording.course?.title || "Uncategorized";
      const courseSlug = recording.course?.slug || "other";
      const key = `${courseSlug}::${courseTitle}`;

      if (!acc[key]) {
        acc[key] = {
          title: courseTitle,
          slug: courseSlug,
          recordings: [],
        };
      }
      acc[key].recordings.push(recording);
      return acc;
    },
    {} as Record<
      string,
      { title: string; slug: string; recordings: Recording[] }
    >,
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (selectedRecording && selectedRecording.recordingUrl) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => setSelectedRecording(null)}
          className="mb-6"
        >
          ← Back to All Recordings
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {selectedRecording.title}
          </h1>
          {selectedRecording.course && (
            <p className="text-muted-foreground">
              Course: {selectedRecording.course.title}
            </p>
          )}
        </div>

        <div className="mb-6 relative">
          <VideoWatermark />
          <BunnyVideoPlayer
            videoId={selectedRecording.recordingUrl}
            autoplay={true}
            controls={true}
            className="aspect-video w-full rounded-lg overflow-hidden"
            userId={session?.user?.id}
          />
        </div>

        {selectedRecording.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {selectedRecording.description}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          {t("navigation.recordings")}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Watch recordings from your completed live lessons
        </p>
      </div>

      {recordings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileVideo className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Recordings Available
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Recordings will appear here after live lessons are completed. Join
              your upcoming live sessions to access recordings later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedRecordings).map(([key, group]) => {
            const isOpen = openFolders.has(key);
            return (
              <Collapsible
                key={key}
                open={isOpen}
                onOpenChange={() => toggleFolder(key)}
                className="group/folder"
              >
                <div className="rounded-lg border bg-card">
                  <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover/folder:bg-primary/20 transition-colors">
                          {isOpen ? (
                            <FolderOpen className="h-5 w-5 text-primary" />
                          ) : (
                            <Folder className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="text-left">
                          <h2 className="text-lg sm:text-xl font-semibold">
                            {group.title}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {group.recordings.length} recording
                            {group.recordings.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.slug !== "other" && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a href={`/dashboard/${group.slug}`}>
                              View Course
                              <ExternalLink className="h-4 w-4 ml-2" />
                            </a>
                          </Button>
                        )}
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 pt-0 border-t">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                        {group.recordings.map((recording) => (
                          <Card
                            key={recording.id}
                            className="hover:shadow-lg transition-all duration-200 hover:scale-[1.01] cursor-pointer group"
                            onClick={() =>
                              recording.recordingUrl &&
                              setSelectedRecording(recording)
                            }
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base sm:text-lg line-clamp-2 flex-1 group-hover:text-primary transition-colors">
                                  {recording.title}
                                </CardTitle>
                                <div className="shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                  <Play className="h-5 w-5 text-primary" />
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {recording.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {recording.description}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  <span className="truncate">
                                    {formatDate(recording.scheduledAt)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  <span>
                                    {formatDuration(recording.duration)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-2">
                                {recording.recordingUrl ? (
                                  <>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRecording(recording);
                                      }}
                                      className="flex-1"
                                      size="sm"
                                    >
                                      <Play className="h-4 w-4 mr-2" />
                                      Watch
                                    </Button>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(
                                          recording.recordingUrl,
                                          "_blank",
                                        );
                                      }}
                                      variant="outline"
                                      size="sm"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button disabled className="flex-1" size="sm">
                                    Processing...
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
