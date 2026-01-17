"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Users,
  Video,
  Plus,
  Edit,
  Trash2,
  Mail,
  Play,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { RecordingUploader } from "@/components/admin/RecordingUploader";
import { RecordingViewer } from "@/components/admin/RecordingViewer";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useSession } from "@/hooks/use-session";
import { UserRole } from "@/lib/rbac";
import { hasDynamicPermission } from "@/lib/dynamic-rbac";
import { useRouter } from "next/navigation";

interface LiveLesson {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  status: "Scheduled" | "InProgress" | "Completed" | "Ended" | "Cancelled";
  zoomJoinUrl?: string;
  zoomStartUrl?: string;
  zoomPassword?: string;
  recordingUrl?: string;
  deletedAt?: string;
  course?: {
    id: string;
    title: string;
  };
  attendees: Array<{
    id: string;
    user: {
      name: string;
      email: string;
    };
    status: string;
  }>;
}

interface Course {
  id: string;
  title: string;
}

export default function LiveLessonsPage() {
  const { session, loading } = useSession();
  const router = useRouter();
  const [liveLessons, setLiveLessons] = useState<LiveLesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LiveLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [sendingNotificationId, setSendingNotificationId] = useState<
    string | null
  >(null);
  const [endingMeetingId, setEndingMeetingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    duration: 60,
    courseId: "",
  });

  // Check permissions
  useEffect(() => {
    if (!loading && session) {
      const userRole = session.user.role as UserRole | null;
      if (!hasDynamicPermission(userRole, "live_lessons_view")) {
        toast.error("You don't have permission to manage live lessons");
        router.push("/admin");
        return;
      }
    }
  }, [session, loading, router]);

  // Fetch data when component mounts and user is authenticated
  useEffect(() => {
    if (!loading && session) {
      const userRole = session.user.role as UserRole | null;
      if (hasDynamicPermission(userRole, "live_lessons_view")) {
        fetchLiveLessons();
        fetchCourses();
      }
    }
  }, [session, loading]);

  // Don't render anything until we've checked permissions
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">Please log in</div>
    );
  }

  const userRole = session.user.role as UserRole | null;
  if (!hasDynamicPermission(userRole, "live_lessons_view")) {
    return (
      <div className="flex items-center justify-center h-64">Access denied</div>
    );
  }

  const fetchLiveLessons = async () => {
    try {
      const response = await fetch("/api/live-lessons");
      if (response.ok) {
        const data = await response.json();
        // Store all lessons (including deleted ones) for the deleted lessons section
        setLiveLessons(data);
      }
    } catch (error) {
      console.error("Error fetching live lessons:", error);
      toast.error("Failed to fetch live lessons");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreLesson = async (lessonId: string) => {
    try {
      const response = await fetch(`/api/live-lessons/${lessonId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deletedAt: null }),
      });

      if (response.ok) {
        toast.success("Live lesson restored successfully");
        fetchLiveLessons();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to restore live lesson");
      }
    } catch (error) {
      console.error("Error restoring live lesson:", error);
      toast.error("Failed to restore live lesson");
    }
  };

  const fetchCourses = async () => {
    try {
      console.log("Fetching courses...");
      const response = await fetch("/api/admin/courses");
      console.log("Courses response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Courses data:", data);
        setCourses(data);
      } else {
        const error = await response.json();
        console.error("Courses error:", error);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleCreateLesson = async () => {
    if (isCreating) return; // Prevent double submission

    // Validate required fields
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.scheduledAt) {
      toast.error("Scheduled date and time is required");
      return;
    }
    if (!formData.courseId || formData.courseId === "none") {
      toast.error("Course selection is required");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/live-lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          courseId: formData.courseId,
        }),
      });

      if (response.ok) {
        toast.success("Live lesson created successfully");
        setIsCreateDialogOpen(false);
        setFormData({
          title: "",
          description: "",
          scheduledAt: "",
          duration: 60,
          courseId: "",
        });
        fetchLiveLessons();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create live lesson");
      }
    } catch (error) {
      console.error("Error creating live lesson:", error);
      toast.error("Failed to create live lesson");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditLesson = (lesson: LiveLesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || "",
      scheduledAt: new Date(lesson.scheduledAt).toISOString().slice(0, 16),
      duration: lesson.duration,
      courseId: lesson.course?.id || "none",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson || isUpdating) return;

    // Validate required fields
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.scheduledAt) {
      toast.error("Scheduled date and time is required");
      return;
    }
    if (!formData.courseId || formData.courseId === "none") {
      toast.error("Course selection is required");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/live-lessons/${editingLesson.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          courseId: formData.courseId,
        }),
      });

      if (response.ok) {
        toast.success("Live lesson updated successfully");
        setIsEditDialogOpen(false);
        setEditingLesson(null);
        fetchLiveLessons();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update live lesson");
      }
    } catch (error) {
      console.error("Error updating live lesson:", error);
      toast.error("Failed to update live lesson");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (deletingLessonId === id) return; // Prevent double deletion

    setDeletingLessonId(id);
    try {
      const response = await fetch(`/api/live-lessons/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deletedAt: new Date().toISOString() }),
      });

      if (response.ok) {
        toast.success(
          "Live lesson deleted successfully (students can still access recordings)",
        );
        fetchLiveLessons();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete live lesson");
      }
    } catch (error) {
      console.error("Error deleting live lesson:", error);
      toast.error("Failed to delete live lesson");
    } finally {
      setDeletingLessonId(null);
    }
  };

  const handleSendNotification = async (lessonId: string) => {
    if (sendingNotificationId) return; // Prevent double submission

    setSendingNotificationId(lessonId);
    try {
      const response = await fetch("/api/live-lessons/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lessonId }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to send notifications");
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast.error("Failed to send notifications");
    } finally {
      setSendingNotificationId(null);
    }
  };

  const handleSendRecordingNotification = async (lessonId: string) => {
    const recordingUrl = prompt("Enter the recording URL:");
    if (!recordingUrl) return;

    if (sendingNotificationId) return; // Prevent double submission

    setSendingNotificationId(lessonId);
    try {
      const response = await fetch("/api/live-lessons/recording", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lessonId, recordingUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        // Refresh the lessons list to show the updated recording URL
        fetchLiveLessons();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to send recording notifications");
      }
    } catch (error) {
      console.error("Error sending recording notifications:", error);
      toast.error("Failed to send recording notifications");
    } finally {
      setSendingNotificationId(null);
    }
  };

  const handleEndMeeting = async (lessonId: string) => {
    if (endingMeetingId) return; // Prevent double submission

    setEndingMeetingId(lessonId);
    try {
      const response = await fetch(`/api/live-lessons/${lessonId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Ended" }),
      });

      if (response.ok) {
        toast.success("Meeting marked as ended successfully");
        // Refresh the lessons list to show the updated status
        fetchLiveLessons();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to end meeting");
      }
    } catch (error) {
      console.error("Error ending meeting:", error);
      toast.error("Failed to end meeting");
    } finally {
      setEndingMeetingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-800";
      case "InProgress":
        return "bg-green-100 text-green-800";
      case "Completed":
        return "bg-gray-100 text-gray-800";
      case "Ended":
        return "bg-red-100 text-red-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Live Lessons</h1>
          <p className="text-muted-foreground">
            Manage live lessons and Zoom meetings
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={!hasDynamicPermission(userRole, "live_lessons_create")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Live Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader className="pb-3">
              <DialogTitle>Create Live Lesson</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter lesson title"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter lesson description (optional)"
                  className="min-h-[70px] resize-none"
                />
              </div>

              {/* Quick Start Buttons */}
              <div className="space-y-1.5">
                <Label className="text-sm">
                  Schedule <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={formData.scheduledAt ? "outline" : "default"}
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      setFormData({
                        ...formData,
                        scheduledAt: now.toISOString().slice(0, 16),
                      });
                    }}
                  >
                    Now
                  </Button>
                  {[10, 20, 30, 45, 60].map((minutes) => (
                    <Button
                      key={minutes}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const future = new Date(
                          Date.now() + minutes * 60 * 1000,
                        );
                        setFormData({
                          ...formData,
                          scheduledAt: future.toISOString().slice(0, 16),
                        });
                      }}
                    >
                      +{minutes}m
                    </Button>
                  ))}
                </div>
                {formData.scheduledAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Scheduled: {new Date(formData.scheduledAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="duration" className="text-sm">
                  Duration (min)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value),
                    })
                  }
                  min={15}
                  max={480}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="courseId" className="text-sm">
                  Course <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.courseId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, courseId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateLesson}
                className="w-full mt-2"
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Live Lesson"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {liveLessons.filter((lesson) => !lesson.deletedAt).length === 0 ? (
          <Card className="max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No live lessons yet
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first live lesson to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          liveLessons
            .filter((lesson) => !lesson.deletedAt)
            .map((lesson) => (
              <Card key={lesson.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        {lesson.title}
                      </CardTitle>
                      <CardDescription>{lesson.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(lesson.status)}>
                        {lesson.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendNotification(lesson.id)}
                        disabled={
                          sendingNotificationId === lesson.id ||
                          !hasDynamicPermission(userRole, "live_lessons_edit")
                        }
                        title={
                          !hasDynamicPermission(userRole, "live_lessons_edit")
                            ? "You do not have permission to send notifications"
                            : "Send notification to all users"
                        }
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      {lesson.status === "Completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleSendRecordingNotification(lesson.id)
                          }
                          disabled={
                            sendingNotificationId === lesson.id ||
                            !hasDynamicPermission(userRole, "live_lessons_edit")
                          }
                          title={
                            !hasDynamicPermission(userRole, "live_lessons_edit")
                              ? "You do not have permission to send notifications"
                              : "Send recording link to all users"
                          }
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditLesson(lesson)}
                        disabled={
                          !hasDynamicPermission(userRole, "live_lessons_edit")
                        }
                        title={
                          !hasDynamicPermission(userRole, "live_lessons_edit")
                            ? "You do not have permission to edit live lessons"
                            : "Edit lesson"
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <ConfirmationDialog
                        title="Delete Live Lesson"
                        description="Are you sure you want to delete this live lesson? This will hide it from the admin panel but students will still be able to access recordings."
                        confirmText="Delete"
                        cancelText="Cancel"
                        variant="destructive"
                        onConfirm={() => handleDeleteLesson(lesson.id)}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={
                            !hasDynamicPermission(
                              userRole,
                              "live_lessons_delete",
                            )
                          }
                          title={
                            !hasDynamicPermission(
                              userRole,
                              "live_lessons_delete",
                            )
                              ? "You do not have permission to delete live lessons"
                              : "Delete lesson"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </ConfirmationDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm break-words">
                        {new Date(lesson.scheduledAt).toLocaleDateString()} at{" "}
                        {new Date(lesson.scheduledAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{lesson.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">
                        {lesson.attendees.length} attendees
                      </span>
                    </div>
                  </div>
                  {lesson.course && (
                    <div className="mt-2">
                      <Badge variant="outline">{lesson.course.title}</Badge>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {lesson.zoomStartUrl && (
                      <Button asChild size="sm">
                        <a
                          href={lesson.zoomStartUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Start Meeting
                        </a>
                      </Button>
                    )}
                    {lesson.zoomJoinUrl && (
                      <Button variant="outline" asChild size="sm">
                        <a
                          href={lesson.zoomJoinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Join Meeting
                        </a>
                      </Button>
                    )}
                    {/* End Meeting Button - only show for lessons that are in progress or scheduled */}
                    {(lesson.status === "InProgress" ||
                      lesson.status === "Scheduled") && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleEndMeeting(lesson.id)}
                        disabled={endingMeetingId === lesson.id}
                        title="Mark meeting as ended"
                      >
                        End Meeting
                      </Button>
                    )}
                    {lesson.recordingUrl && (
                      <RecordingViewer
                        recordingUrl={lesson.recordingUrl}
                        lessonTitle={lesson.title}
                      />
                    )}
                    <RecordingUploader
                      lessonId={lesson.id}
                      lessonTitle={lesson.title}
                      currentRecordingUrl={lesson.recordingUrl}
                      onRecordingUploaded={fetchLiveLessons}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {/* Deleted Lessons Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Deleted Lessons</h2>
        <p className="text-muted-foreground mb-4">
          These lessons are hidden from the main view but students can still
          access recordings.
        </p>
        <div className="grid gap-4">
          {liveLessons
            .filter((lesson) => lesson.deletedAt)
            .map((lesson) => (
              <Card key={lesson.id} className="border-dashed border-gray-300">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{lesson.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {lesson.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          Deleted:{" "}
                          {new Date(lesson.deletedAt!).toLocaleDateString()}
                        </span>
                        <span>Status: {lesson.status}</span>
                        {lesson.recordingUrl && (
                          <span className="text-green-600">Has Recording</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreLesson(lesson.id)}
                        title="Restore this lesson"
                      >
                        Restore
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          {liveLessons.filter((lesson) => lesson.deletedAt).length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">No deleted lessons</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader className="pb-3">
            <DialogTitle>Edit Live Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title" className="text-sm">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter lesson title"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-sm">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter lesson description (optional)"
                className="min-h-[70px] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-scheduledAt" className="text-sm">
                  Date & Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledAt: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-duration" className="text-sm">
                  Duration (min)
                </Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value),
                    })
                  }
                  min={15}
                  max={480}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-courseId" className="text-sm">
                Course <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.courseId}
                onValueChange={(value) =>
                  setFormData({ ...formData, courseId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleUpdateLesson}
              className="w-full mt-2"
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update Live Lesson"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
