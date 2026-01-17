"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Play, ExternalLink, FileVideo } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { RecordingViewer } from '@/components/admin/RecordingViewer';

interface Recording {
  id: string;
  title: string;
  description?: string;
  recordingUrl: string;
  scheduledAt: string;
  duration: number;
  courseName?: string;
  status: string;
  createdAt: string;
}

export default function RecordingsWidget() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      const response = await fetch('/api/user/recordings');
      if (response.ok) {
        const data = await response.json();
        setRecordings(data);
      } else {
        console.error('Failed to fetch recordings');
      }
    } catch (error) {
      console.error('Error fetching recordings:', error);
      toast.error('Failed to load recordings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            Past Recordings
          </CardTitle>
          <CardDescription>
            Access recordings from your previous live lessons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading recordings...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recordings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            Past Recordings
          </CardTitle>
          <CardDescription>
            Access recordings from your previous live lessons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileVideo className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium mb-2">No recordings yet</p>
            <p className="text-sm mb-4">
              Recordings from your live lessons will appear here once they're available
            </p>
            <Button variant="outline" size="sm" disabled>
              View All Recordings
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentRecordings = recordings.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileVideo className="h-5 w-5" />
              Past Recordings
            </CardTitle>
            <CardDescription>
              Access recordings from your previous live lessons
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentRecordings.map((recording) => (
            <div key={recording.id} className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Play className="h-6 w-6 text-primary" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm truncate">{recording.title}</h4>
                    {recording.courseName && (
                      <p className="text-xs text-muted-foreground truncate">
                        Course: {recording.courseName}
                      </p>
                    )}
                    {recording.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {recording.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className={getStatusColor(recording.status)}>
                    {recording.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(recording.scheduledAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(recording.duration)}
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <RecordingViewer 
                  recordingUrl={recording.recordingUrl}
                  lessonTitle={recording.title}
                />
              </div>
            </div>
          ))}
        </div>
        
        {recordings.length > 3 && (
          <div className="mt-4 pt-4 border-t">
                      <Button variant="ghost" size="sm" className="w-full" disabled>
            View {recordings.length - 3} more recordings
          </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
