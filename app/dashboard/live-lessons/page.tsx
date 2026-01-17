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
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Play,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/components/general/I18nProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LiveLesson {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  status: "Scheduled" | "InProgress" | "Completed" | "Cancelled";
  zoomJoinUrl?: string;
  zoomPassword?: string;
  recordingUrl?: string;
  course?: {
    id: string;
    title: string;
  };
}

export default function LiveLessonsPage() {
  const t = useTranslations();
  const [liveLessons, setLiveLessons] = useState<LiveLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLiveLessons();
  }, []);

  const fetchLiveLessons = async () => {
    try {
      const response = await fetch("/api/live-lessons");
      if (response.ok) {
        const data = await response.json();
        setLiveLessons(data);
      }
    } catch (error) {
      console.error("Error fetching live lessons:", error);
      toast.error("Failed to fetch live lessons");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const getActualStatus = (lesson: LiveLesson) => {
    const now = new Date();
    const scheduledAt = new Date(lesson.scheduledAt);
    const endTime = new Date(scheduledAt.getTime() + lesson.duration * 60000);

    if (now >= scheduledAt && now <= endTime) {
      return "InProgress";
    } else if (now > endTime) {
      return "Ended";
    } else {
      return lesson.status;
    }
  };

  const isLessonStartingSoon = (scheduledAt: string) => {
    const lessonTime = new Date(scheduledAt);
    const now = new Date();
    const timeDiff = lessonTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    return minutesDiff <= 15 && minutesDiff >= -5;
  };

  const getTimeUntilStart = (scheduledAt: string) => {
    const lessonTime = new Date(scheduledAt);
    const now = new Date();
    const timeDiff = lessonTime.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    if (timeDiff < 0) {
      return "Started";
    } else if (minutesDiff < 60) {
      return `Starts in ${minutesDiff}m`;
    } else if (minutesDiff < 1440) {
      return `Starts in ${Math.floor(minutesDiff / 60)}h`;
    } else {
      return `Starts in ${Math.floor(minutesDiff / 1440)}d`;
    }
  };

  const liveLessonsNow = liveLessons.filter(
    (lesson) => getActualStatus(lesson) === "InProgress",
  );
  const upcomingLessons = liveLessons.filter(
    (lesson) => getActualStatus(lesson) === "Scheduled",
  );
  const endedLessons = liveLessons.filter(
    (lesson) =>
      getActualStatus(lesson) === "Ended" || lesson.status === "Completed",
  );

  const renderLessonCard = (lesson: LiveLesson) => {
    const { date, time } = formatDateTime(lesson.scheduledAt);
    const canJoin = isLessonStartingSoon(lesson.scheduledAt);
    const timeUntilStart = getTimeUntilStart(lesson.scheduledAt);
    const actualStatus = getActualStatus(lesson);

    return (
      <Card
        key={lesson.id}
        className="hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-2">
                {lesson.title}
              </CardTitle>
              {lesson.course && (
                <p className="text-sm text-muted-foreground mt-1">
                  Course: {lesson.course.title}
                </p>
              )}
            </div>
            {actualStatus === "InProgress" && (
              <Badge className="bg-red-500 text-white animate-pulse shrink-0">
                🔴 Live
              </Badge>
            )}
            {actualStatus === "Ended" && (
              <Badge variant="secondary" className="shrink-0">
                Ended
              </Badge>
            )}
            {actualStatus === "Scheduled" && (
              <Badge variant="outline" className="shrink-0">
                Upcoming
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lesson.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {lesson.description}
            </p>
          )}

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{time}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Video className="h-4 w-4" />
              <span>{lesson.duration}h</span>
            </div>
          </div>

          {actualStatus === "Scheduled" && canJoin && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-800 dark:text-green-200 font-medium">
                🟢 {timeUntilStart}
              </div>
            </div>
          )}

          {/* Only show action buttons for non-ended lessons */}
          {actualStatus !== "Ended" && lesson.status !== "Completed" && (
            <div className="flex gap-2 pt-2">
              {lesson.zoomJoinUrl && (
                <Button
                  onClick={() => window.open(lesson.zoomJoinUrl, "_blank")}
                  className="flex-1"
                  size="sm"
                  disabled={!canJoin && actualStatus !== "InProgress"}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {actualStatus === "InProgress"
                    ? "Join Now"
                    : canJoin
                      ? "Join Meeting"
                      : "Not Started"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          {t("navigation.liveLessons")}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Join live sessions or watch recordings from completed lessons
        </p>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="live" className="gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Live Now {liveLessonsNow.length > 0 && `(${liveLessonsNow.length})`}
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming{" "}
            {upcomingLessons.length > 0 && `(${upcomingLessons.length})`}
          </TabsTrigger>
          <TabsTrigger value="past">
            Past {endedLessons.length > 0 && `(${endedLessons.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-6">
          {liveLessonsNow.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Video className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Live Lessons</h3>
                <p className="text-sm text-muted-foreground text-center">
                  There are no live lessons happening right now. Check upcoming
                  lessons.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveLessonsNow.map(renderLessonCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingLessons.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Upcoming Lessons
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  There are no scheduled live lessons at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingLessons.map(renderLessonCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {endedLessons.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Play className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Past Lessons</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Past live lessons will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {endedLessons.map(renderLessonCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
