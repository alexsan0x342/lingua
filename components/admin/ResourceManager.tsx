"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, FileText, Download, Link2, File } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  url: z.string().optional().refine((val) => {
    if (!val) return true; // Allow empty/undefined
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, "Please enter a valid URL"),
  fileId: z.string().optional(),
  type: z.enum(["link", "file", "video", "document", "other"]),
  isRequired: z.boolean(),
}).refine((data) => {
  return data.url || data.fileId;
}, {
  message: "Either URL or File ID is required",
  path: ["url"], // This will show the error on the URL field
});

type ResourceFormData = z.infer<typeof resourceSchema>;

interface Resource {
  id: string;
  title: string;
  description?: string;
  url?: string;
  fileId?: string;
  type: "link" | "file" | "video" | "document" | "other";
  isRequired: boolean;
  createdAt: string;
}

interface ResourceManagerProps {
  lessonId: string;
  resources: Resource[];
  onResourcesChange: () => void;
}

export function ResourceManager({
  lessonId,
  resources,
  onResourcesChange,
}: ResourceManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      fileId: "",
      type: "link",
      isRequired: false,
    },
  });

  const resetForm = () => {
    form.reset();
    setEditingResource(null);
    setIsDialogOpen(false);
  };

  const onSubmit = async (data: ResourceFormData) => {
    setIsSubmitting(true);
    try {
      const url = editingResource
        ? `/api/admin/lessons/${lessonId}/resources/${editingResource.id}`
        : `/api/admin/lessons/${lessonId}/resources`;

      const method = editingResource ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save resource");
      }

      toast.success(
        editingResource
          ? "Resource updated successfully"
          : "Resource created successfully"
      );

      resetForm();
      onResourcesChange();
    } catch (error) {
      console.error("Error saving resource:", error);
      toast.error("Failed to save resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    form.reset({
      title: resource.title,
      description: resource.description || "",
      url: resource.url || "",
      fileId: resource.fileId || "",
      type: resource.type,
      isRequired: resource.isRequired,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (resourceId: string) => {
    try {
      const response = await fetch(
        `/api/admin/lessons/${lessonId}/resources/${resourceId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete resource");
      }

      toast.success("Resource deleted successfully");
      onResourcesChange();
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "link":
        return "bg-primary/10 text-primary";
      case "file":
        return "bg-secondary/80 text-secondary-foreground";
      case "video":
        return "bg-accent/80 text-accent-foreground";
      case "document":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "link":
        return <Link2 className="h-4 w-4" />;
      case "file":
        return <File className="h-4 w-4" />;
      case "video":
        return <FileText className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Resources</h3>
          <p className="text-sm text-muted-foreground">
            Manage lesson resources and downloads
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingResource(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingResource ? "Edit Resource" : "Create Resource"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Resource title" {...field} />
                      </FormControl>
                      <FormMessage />
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
                        <Textarea
                          placeholder="Brief description of the resource"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select resource type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="link">Link</SelectItem>
                          <SelectItem value="file">File</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="document">Document</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL (for links)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fileId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File ID (for uploaded files)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="File identifier"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isRequired"
                    {...form.register("isRequired")}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="isRequired" className="text-sm font-medium">
                    Required Resource
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Saving..."
                      : editingResource
                      ? "Update"
                      : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {resources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No resources yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first resource to provide additional materials for this lesson
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-2 flex items-center gap-2">
                    {getTypeIcon(resource.type)}
                    {resource.title}
                  </CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(resource)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this resource?")) {
                          handleDelete(resource.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {resource.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {resource.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Badge className={getTypeColor(resource.type)}>
                    {resource.type}
                  </Badge>
                  {resource.isRequired && (
                    <Badge variant="destructive">Required</Badge>
                  )}
                </div>

                {(resource.url || resource.fileId) && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (resource.url) {
                          window.open(resource.url, "_blank");
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {resource.type === "link" ? "Visit Link" : "Download"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
