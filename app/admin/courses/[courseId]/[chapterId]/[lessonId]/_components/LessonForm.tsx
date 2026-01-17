"use client";

import { AdminLessonType } from "@/app/data/admin/admin-get-lesson";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { ArrowLeft, Trash2, Gift } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Uploader } from "@/components/file-uploader/Uploader";
import { BunnyVideoUploader } from "@/components/video/BunnyVideoUploader";
import { useTransition, useState, useEffect } from "react";
import { tryCatch } from "@/hooks/try-catch";
import { updateLesson } from "../actions";
import { toast } from "sonner";
import { useDeleteLesson } from "@/hooks/use-deletion";
import { DeleteConfirmation } from "@/components/general/DeleteConfirmation";
import { useRouter } from "next/navigation";
import AssignmentManager from "@/components/admin/AssignmentManager";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { Switch } from "@/components/ui/switch";

interface iAppProps {
  data: AdminLessonType;
  chapterId: string;
  courseId: string;
}

export function LessonForm({ chapterId, data, courseId }: iAppProps) {
  const [pending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [resources, setResources] = useState([]);
  const router = useRouter();

  // Validate that we have the required data
  if (!data || !data.id) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Invalid Lesson Data</CardTitle>
            <CardDescription>
              The lesson data is missing or corrupted. Please try refreshing the
              page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/admin/courses">Back to Courses</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: data.title,
      chapterId: chapterId,
      courseId: courseId,
      description: data.description ?? undefined,
      videoKey: data.videoKey ?? undefined,
      playbackId: data.playbackId ?? undefined,
      thumbnailKey: data.thumbnailKey ?? undefined,
      isFree: data.isFree ?? false,
    },
  });

  const { deleteLesson, isDeleting } = useDeleteLesson({
    onSuccess: () => {
      setShowDeleteConfirm(false);
      toast.success("Lesson deleted successfully");
      // Use replace to prevent going back to deleted lesson page
      router.replace(`/admin/courses/${courseId}`);
    },
    onError: (error) => {
      toast.error(error || "Failed to delete lesson");
    },
  });

  const fetchResources = async () => {
    try {
      const response = await fetch(`/api/admin/lessons/${data.id}/resources`);
      if (response.ok) {
        const result = await response.json();
        setResources(result.resources || []);
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [data.id]);

  // 2. Define a submit handler.
  function onSubmit(values: LessonSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        updateLesson(values, data.id),
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }
  return (
    <div className="space-y-6">
      <Link
        className={buttonVariants({ variant: "outline", className: "mb-6" })}
        href={`/admin/courses/${courseId}/edit`}
      >
        <ArrowLeft className="size-4" />
        <span>Go Back</span>
      </Link>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Lesson Details</TabsTrigger>
          <TabsTrigger value="assignments">Assignments & Resources</TabsTrigger>
        </TabsList>{" "}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Configuration</CardTitle>
              <CardDescription>
                Configure the video and description for this lesson.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lesson Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Chapter xyz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center gap-2">
                            <Gift className="size-4 text-green-500" />
                            Free Preview
                          </FormLabel>
                          <FormDescription>
                            Make this lesson available for free preview without
                            purchase
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <RichTextEditor field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="thumbnailKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thumbnail image</FormLabel>
                        <FormControl>
                          <Uploader
                            fileTypeAccepted="image"
                            onChange={field.onChange}
                            value={field.value}
                            lessonId={data.id}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="videoKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video File</FormLabel>
                        <FormControl>
                          <BunnyVideoUploader
                            onChange={field.onChange}
                            value={field.value}
                            lessonId={data.id}
                            courseId={courseId}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between items-center">
                    <Button disabled={pending} type="submit">
                      {pending ? "Saving.." : "Save Lesson"}
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={pending || isDeleting}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Lesson
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="assignments">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
                <CardDescription>
                  Manage assignments for this lesson
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <AssignmentManager lessonId={data.id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
                <CardDescription>
                  Additional resources and materials for this lesson
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ResourceManager
                  lessonId={data.id}
                  resources={resources}
                  onResourcesChange={fetchResources}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteLesson(data.id)}
        isLoading={isDeleting}
        title="Delete Lesson"
        description={`Are you sure you want to delete "${data.title}"? This action cannot be undone and will remove the lesson, its video content, and all associated data.`}
      />
    </div>
  );
}
