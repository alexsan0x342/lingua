"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

type AssignmentType = "text" | "file" | "both";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  submissionType: AssignmentType;
  instructions: string;
  maxPoints: number | null;
  dueDate: Date | null;
  isRequired: boolean;
  fileRequired: boolean;
  position: number;
  lessonId: string;
  lesson?: {
    title: string;
  };
}

interface AssignmentManagerProps {
  lessonId: string;
}

function AssignmentManager({ lessonId }: AssignmentManagerProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    submissionType: "text" as AssignmentType,
    instructions: "",
    maxPoints: "",
    dueDate: "",
    isRequired: false,
    fileRequired: false,
  });

  useEffect(() => {
    fetchAssignments();
  }, [lessonId]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch(
        `/api/admin/assignments?lessonId=${lessonId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
      toast.error("Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (submitting) return; // Prevent multiple submissions

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        lessonId,
        maxPoints: formData.maxPoints ? parseInt(formData.maxPoints) : null,
        dueDate: formData.dueDate || null,
      };

      const url = editing
        ? `/api/admin/assignments/${editing}`
        : "/api/admin/assignments";

      const method = editing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editing ? "Assignment updated!" : "Assignment created!");
        setFormData({
          title: "",
          description: "",
          submissionType: "text",
          instructions: "",
          maxPoints: "",
          dueDate: "",
          isRequired: false,
          fileRequired: false,
        });
        setEditing(null);
        setShowForm(false);
        fetchAssignments();
      } else {
        throw new Error("Failed to save assignment");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setFormData({
      title: assignment.title,
      description: assignment.description || "",
      submissionType: assignment.submissionType,
      instructions: assignment.instructions,
      maxPoints: assignment.maxPoints?.toString() || "",
      dueDate: assignment.dueDate
        ? assignment.dueDate.toString().split("T")[0]
        : "",
      isRequired: assignment.isRequired,
      fileRequired: assignment.fileRequired,
    });
    setEditing(assignment.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      const response = await fetch(`/api/admin/assignments/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Assignment deleted!");
        fetchAssignments();
      } else {
        throw new Error("Failed to delete assignment");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete assignment");
    }
  };

  const cancelEdit = () => {
    setFormData({
      title: "",
      description: "",
      submissionType: "text",
      instructions: "",
      maxPoints: "",
      dueDate: "",
      isRequired: false,
      fileRequired: false,
    });
    setEditing(null);
    setShowForm(false);
  };

  if (loading) {
    return <div>Loading assignments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Assignments</h3>
        <Button
          onClick={() => setShowForm(true)}
          size="sm"
          disabled={showForm || submitting}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Assignment
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editing ? "Edit Assignment" : "Add New Assignment"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Assignment title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Assignment description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Instructions *
                </label>
                <Textarea
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData({ ...formData, instructions: e.target.value })
                  }
                  placeholder="Detailed instructions for students"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Submission Type
                </label>
                <Select
                  value={formData.submissionType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      submissionType: value as AssignmentType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Only</SelectItem>
                    <SelectItem value="file">File Upload</SelectItem>
                    <SelectItem value="both">Text + File</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Max Points
                  </label>
                  <Input
                    type="number"
                    value={formData.maxPoints}
                    onChange={(e) =>
                      setFormData({ ...formData, maxPoints: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRequired"
                  checked={formData.isRequired}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isRequired: !!checked })
                  }
                />
                <label htmlFor="isRequired" className="text-sm font-medium">
                  Required Assignment
                </label>
              </div>

              {(formData.submissionType === "file" ||
                formData.submissionType === "both") && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fileRequired"
                    checked={formData.fileRequired}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, fileRequired: !!checked })
                    }
                  />
                  <label htmlFor="fileRequired" className="text-sm font-medium">
                    File Upload Required
                  </label>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {editing ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{editing ? "Update" : "Create"} Assignment</>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No assignments yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{assignment.title}</h4>
                      <Badge
                        variant={
                          assignment.submissionType === "text"
                            ? "default"
                            : assignment.submissionType === "file"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {assignment.submissionType}
                      </Badge>
                      {assignment.isRequired && (
                        <Badge variant="destructive">Required</Badge>
                      )}
                    </div>

                    {assignment.description && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {assignment.description}
                      </p>
                    )}

                    <div className="text-xs text-muted-foreground space-y-1">
                      {assignment.maxPoints && (
                        <div>Max Points: {assignment.maxPoints}</div>
                      )}
                      {assignment.dueDate && (
                        <div>
                          Due:{" "}
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(assignment)}
                      disabled={showForm || submitting}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(assignment.id)}
                      disabled={submitting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AssignmentManager;
