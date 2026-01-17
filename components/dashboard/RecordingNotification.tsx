"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, X, FileVideo } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface RecordingNotificationProps {
  recordingId: string;
  title: string;
  courseName?: string;
  recordingUrl: string;
  onDismiss: (id: string) => void;
}

export default function RecordingNotification({ 
  recordingId, 
  title, 
  courseName, 
  recordingUrl, 
  onDismiss 
}: RecordingNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(recordingId), 300);
  };

  const handleWatch = () => {
    if (typeof window !== 'undefined') {
      window.open(recordingUrl, '_blank');
      toast.success('Opening recording in new tab');
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 animate-in slide-in-from-top-2 duration-300">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <FileVideo className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  New Recording Available!
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 truncate">
                  {title}
                </p>
                {courseName && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Course: {courseName}
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                New
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleWatch}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Play className="h-3 w-3 mr-1" />
                Watch Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled
                className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900"
              >
                View All
              </Button>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-green-600 hover:text-green-800 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-200 dark:hover:bg-green-900"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
