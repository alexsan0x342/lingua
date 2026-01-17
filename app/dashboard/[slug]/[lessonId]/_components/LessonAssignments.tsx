"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, Upload, CheckCircle, XCircle, Clock } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useTranslations } from "@/components/general/I18nProvider";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  submissionType: string;
  instructions: string;
  maxPoints: number | null;
  dueDate: Date | null;
  isRequired: boolean;
  fileRequired: boolean;
  position: number;
}

interface SubmissionData {
  id: string;
  content: string | null;
  fileKey: string | null;
  grade: number | null;
  feedback: string | null;
  submittedAt: Date;
  gradedAt: Date | null;
  assignmentId: string;
  studentId: string;
}

interface LessonAssignmentsProps {
  lessonId: string;
  courseId: string;
  assignments: Assignment[];
}

export default function LessonAssignments({ lessonId, courseId, assignments }: LessonAssignmentsProps) {
  const t = useTranslations();
  const { data: user } = authClient.useSession();
  const [submissions, setSubmissions] = useState<Record<string, SubmissionData>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [totalPoints, setTotalPoints] = useState<number>(0);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch(`/api/submissions?lessonId=${lessonId}`);
        if (response.ok) {
          const data = await response.json();
          const submissionMap: Record<string, SubmissionData> = {};
          data.forEach((submission: SubmissionData) => {
            submissionMap[submission.assignmentId] = submission;
          });
          setSubmissions(submissionMap);
        }
      } catch (error) {
        console.error("Error fetching submissions:", error);
      }
    };

    fetchSubmissions();
  }, [lessonId]);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const response = await fetch(`/api/user/course-points?courseId=${courseId}`);
        if (response.ok) {
          const data = await response.json();
          setTotalPoints(data.earnedPoints || 0);
        }
      } catch (error) {
        console.error("Error fetching course points:", error);
      }
    };

    if (user) {
      fetchPoints();
    }
  }, [user, courseId]);

  const handleSubmit = async (assignmentId: string, formData: FormData) => {
    setIsLoading(prev => ({ ...prev, [assignmentId]: true }));

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Assignment submitted successfully! Please wait for your teacher to grade your work.");
        setSubmissions(prev => ({ ...prev, [assignmentId]: result.submission }));
        // Remove points increment since no points are awarded on submission
      } else {
        toast.error(result.error || "Failed to submit assignment");
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
      toast.error("An error occurred while submitting the assignment");
    } finally {
      setIsLoading(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const downloadFile = async (fileKey: string) => {
    try {
      const response = await fetch(`/api/files/${fileKey}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        // Extract filename from fileKey or use default
        const fileName = fileKey.includes('_') ? fileKey.split('_').slice(1).join('_') : 'download';
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast.error("Failed to download file");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("An error occurred while downloading the file");
    }
  };

  const getSubmissionStatus = (assignmentId: string) => {
    const submission = submissions[assignmentId];
    if (!submission) return 'not-submitted';
    if (submission.grade !== null && submission.grade !== undefined) return 'graded';
    return 'submitted';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'graded') {
      return (
        <Badge variant="default" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t("lessons.graded")}
        </Badge>
      );
    }
    if (status === 'submitted') {
      return (
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
          <Clock className="w-3 h-3 mr-1" />
          {t("lessons.awaitingGrade")}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
        <XCircle className="w-3 h-3 mr-1" />
        {t("lessons.notSubmitted")}
      </Badge>
    );
  };

  if (assignments.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No assignments for this lesson.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("lessons.assignments")}</h3>
        <div className="text-sm text-muted-foreground">
          {t("lessons.totalPoints")}: <span className="font-semibold text-foreground">{totalPoints}</span>
        </div>
      </div>
      
      {assignments.map((assignment) => {
        const submission = submissions[assignment.id];
        const status = getSubmissionStatus(assignment.id);
        const isSubmitted = status !== 'not-submitted';

        return (
          <Card 
            key={assignment.id}
            className={`transition-all duration-200 hover:shadow-md ${
              isSubmitted 
                ? 'border-green-200 bg-green-50/30' 
                : 'border-border hover:border-border/80'
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {assignment.title}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {assignment.description}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(status)}
                  <span className="text-sm font-medium text-muted-foreground">
                    {assignment.maxPoints || 0} {t("lessons.points")}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {isSubmitted ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("lessons.submissionStatus")}:</span>
                    {getStatusBadge(status)}
                  </div>

                  {submission?.content && (
                    <div>
                      <Label className="text-sm font-medium">{t("lessons.yourSubmission")}:</Label>
                      <div className="mt-1 p-3 bg-muted/50 rounded-md border">
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {submission.content}
                        </p>
                      </div>
                    </div>
                  )}

                  {submission?.fileKey && (
                    <div>
                      <Label className="text-sm font-medium">{t("lessons.submittedFile")}:</Label>
                      <div className="mt-1 flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile(submission.fileKey!)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {submission.fileKey.includes('_') ? submission.fileKey.split('_').slice(1).join('_') : t("lessons.downloadFile")}
                        </Button>
                      </div>
                    </div>
                  )}

                  {submission?.feedback && (
                    <div>
                      <Label className="text-sm font-medium">{t("lessons.instructorFeedback")}:</Label>
                      <div className="mt-1 p-3 bg-blue-50/50 rounded-md border border-blue-200/50">
                        <p className="text-sm text-blue-900 whitespace-pre-wrap">
                          {submission.feedback}
                        </p>
                      </div>
                    </div>
                  )}

                  {status === 'graded' && submission?.grade !== null && submission?.grade !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-md border border-green-200/50">
                      <span className="text-sm font-medium text-green-900">{t("lessons.pointsEarned")}:</span>
                      <span className="text-lg font-bold text-green-900">
                        {submission.grade} / {assignment.maxPoints || 0}
                      </span>
                    </div>
                  )}

                  {status === 'submitted' && (
                    <div className="p-3 bg-blue-50/50 rounded-md border border-blue-200/50">
                      <p className="text-sm text-blue-900">
                        <strong>⏱️ {t("lessons.waitingForRating")}:</strong> {t("lessons.waitingForRatingDesc")}
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-amber-50/50 rounded-md border border-amber-200/50">
                    <p className="text-sm text-amber-900">
                      <strong>{t("lessons.note")}:</strong> {t("lessons.alreadySubmittedNote")}
                    </p>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    formData.append('assignmentId', assignment.id);
                    formData.append('lessonId', lessonId);
                    handleSubmit(assignment.id, formData);
                  }}
                  className="space-y-4"
                >
                  {(assignment.submissionType === 'text' || assignment.submissionType === 'both') && (
                    <div>
                      <Label htmlFor={`content-${assignment.id}`}>{t("lessons.yourAnswer")}</Label>
                      <Textarea
                        id={`content-${assignment.id}`}
                        name="content"
                        placeholder={t("lessons.enterAnswer")}
                        className="mt-1"
                        rows={4}
                        required={assignment.submissionType === 'text'}
                      />
                    </div>
                  )}

                  {(assignment.submissionType === 'file' || assignment.submissionType === 'both') && (
                    <div>
                      <Label htmlFor={`file-${assignment.id}`}>
                        {t("lessons.uploadFile")} {assignment.fileRequired ? `(${t("lessons.required")})` : `(${t("lessons.optional")})`}
                      </Label>
                      <Input
                        id={`file-${assignment.id}`}
                        name="file"
                        type="file"
                        className="mt-1"
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                        required={assignment.fileRequired}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("lessons.acceptedFormats")}: PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB)
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading[assignment.id]}
                  >
                    {isLoading[assignment.id] ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-spin" />
                        {t("lessons.submitting")}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {t("lessons.submitAssignment")}
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
