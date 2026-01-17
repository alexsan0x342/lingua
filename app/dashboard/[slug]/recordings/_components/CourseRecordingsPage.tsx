"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Play, FileVideo, ExternalLink, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { RecordingViewer } from '@/components/admin/RecordingViewer';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from '@/components/general/I18nProvider';

interface LiveLesson {
  id: string;
  title: string;
  description?: string;
  recordingUrl?: string;
  scheduledAt: string;
  duration: number;
  status: string;
  zoomJoinUrl?: string;
  zoomPassword?: string;
}

interface CourseRecordingsPageProps {
  courseSlug: string;
  courseTitle: string;
}

export function CourseRecordingsPage({ courseSlug, courseTitle }: CourseRecordingsPageProps) {
  const t = useTranslations();
  const [recordings, setRecordings] = useState<LiveLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseRecordings();
  }, [courseSlug]);

  const fetchCourseRecordings = async () => {
    try {
      const response = await fetch(`/api/user/course-recordings?courseSlug=${courseSlug}`);
      
      if (response.ok) {
        const data = await response.json();
        setRecordings(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch course recordings:', response.status, errorData);
        setRecordings([]);
      }
    } catch (error) {
      console.error('Error fetching course recordings:', error);
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Ended':
        return 'bg-red-100 text-red-800';
      case 'Starting':
      case 'Started':
      case 'InProgress':
        return 'bg-red-100 text-red-800';
      case 'Scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status: string) => {
    if (status === 'Scheduled') return t("courses.scheduled");
    if (status === 'Completed') return t("courses.completed");
    if (status === 'Ended') return t("courses.ended");
    return status;
  };

  // Check if a scheduled lesson has already passed
  const hasLessonEnded = (scheduledAt: string, duration: number) => {
    const lessonEndTime = new Date(scheduledAt).getTime() + (duration * 60 * 1000);
    return Date.now() > lessonEndTime;
  };

  // Filter for lessons with recordings OR lessons that have ended (even if no recording yet)
  const lessonsWithRecordings = recordings.filter(lesson => {
    const lessonEnded = hasLessonEnded(lesson.scheduledAt, lesson.duration);
    return lesson.recordingUrl || (lessonEnded && lesson.status === 'Scheduled');
  });

  // Filter for upcoming/ongoing live lessons (only show if not ended)
  const liveLessons = recordings.filter(lesson => {
    const lessonEnded = hasLessonEnded(lesson.scheduledAt, lesson.duration);
    if (lessonEnded) return false; // Don't show ended lessons in live section
    
    return lesson.status === 'Scheduled' || 
      lesson.status === 'Starting' || 
      lesson.status === 'Started' || 
      lesson.status === 'InProgress';
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href={`/dashboard/${courseSlug}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("courses.backToCourse")}
            </Button>
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {t("courses.courseRecordings")}
        </h1>
        <p className="text-muted-foreground">
          {t("courses.liveLessonRecordingsFor")} <strong>{courseTitle}</strong>
        </p>
      </div>

      <div className="space-y-6">
        {/* Live Lessons Section */}
        {liveLessons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                {t("courses.upcomingLiveSessions")}
              </CardTitle>
              <CardDescription>
                {t("courses.joinLiveSessionsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {liveLessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-base">{lesson.title}</h4>
                        <Badge variant="secondary" className={getStatusColor(lesson.status)}>
                          {getStatusText(lesson.status)}
                        </Badge>
                      </div>
                      
                      {lesson.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {lesson.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(lesson.scheduledAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDuration(lesson.duration)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {lesson.zoomJoinUrl && (
                        <Button
                          size="sm"
                          variant={(lesson.status === 'Starting' || lesson.status === 'Started' || lesson.status === 'InProgress') ? "default" : "outline"}
                          asChild
                        >
                          <a 
                            href={lesson.zoomJoinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {(lesson.status === 'Starting' || lesson.status === 'Started' || lesson.status === 'InProgress') ? t("courses.joinNow") : t("courses.joinMeeting")}
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recordings Section */}
        {lessonsWithRecordings.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="h-5 w-5" />
                {t("courses.availableRecordings")}
              </CardTitle>
              <CardDescription>
                {t("courses.watchRecordingsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lessonsWithRecordings.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-base">{lesson.title}</h4>
                        <Badge variant="secondary" className={getStatusColor(lesson.status)}>
                          {getStatusText(lesson.status)}
                        </Badge>
                      </div>
                      
                      {lesson.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {lesson.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(lesson.scheduledAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDuration(lesson.duration)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {lesson.recordingUrl ? (
                        <RecordingViewer 
                          recordingUrl={lesson.recordingUrl}
                          lessonTitle={lesson.title}
                        />
                      ) : (
                        <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                          {t("courses.processingRecording")}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="h-5 w-5" />
                {t("courses.noRecordingsAvailable")}
              </CardTitle>
              <CardDescription>
                {t("courses.recordingsWillAppear")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileVideo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("courses.noRecordingsYet")}</p>
                <p className="text-sm mt-2">
                  {t("courses.checkBackAfterCompletion")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
