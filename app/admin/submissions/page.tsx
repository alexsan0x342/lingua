import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { requireAnalyticsAccess } from "@/app/data/admin/require-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, User, Calendar } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ClientGradingWrapper } from "./ClientGradingWrapper";
import { constructUrl } from "@/hooks/use-construct-url";

export default async function SubmissionsPage() {
  const session = await requireAnalyticsAccess();
  const userRole = session.user.role;
  const isManager = userRole === 'MANAGER';

  const submissions = await prisma.assignmentSubmission.findMany({
    where: {
      ...(isManager && {
        assignment: {
          lesson: {
            Chapter: {
              Course: {
                userId: session.user.id,
              },
            },
          },
        },
      }),
    },
    include: {
      assignment: {
        select: {
          title: true,
          maxPoints: true,
          lesson: {
            select: {
              title: true,
              Chapter: {
                select: {
                  title: true,
                  Course: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      student: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
  });

  return (
    <div className="p-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Assignment Submissions</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Assignment Submissions</h1>
        <p className="text-muted-foreground mt-2">
          Review and grade student assignment submissions
        </p>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
            <p className="text-muted-foreground">
              Student assignment submissions will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {submissions.map((submission) => (
            <Card key={submission.id} className="border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {submission.assignment.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {submission.student.name} ({submission.student.email})
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">
                          {submission.assignment.lesson.Chapter.Course.title} → {submission.assignment.lesson.Chapter.title} → {submission.assignment.lesson.title}
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {submission.grade !== null ? (
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        Graded: {submission.grade}/{submission.assignment.maxPoints || "∞"}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Review
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {submission.content && (
                    <div>
                      <div className="text-sm font-medium">Text Submission:</div>
                      <div className="mt-1 p-3 bg-muted rounded-md">
                        <p className="text-sm whitespace-pre-wrap">{submission.content}</p>
                      </div>
                    </div>
                  )}
                  
                  {submission.fileKey && (
                    <div>
                      <div className="text-sm font-medium">File Submission:</div>
                      <div className="mt-1 space-y-2">
                        {/* Show image preview if it's an image file */}
                        {/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(submission.fileKey) && (
                          <div className="relative w-full max-w-md border rounded-lg overflow-hidden bg-muted">
                            <img 
                              src={constructUrl(submission.fileKey)} 
                              alt="Submitted file preview"
                              className="w-full h-auto"
                            />
                          </div>
                        )}
                        {/* Download button */}
                        <div className="p-3 bg-muted rounded-md">
                          <a 
                            href={constructUrl(submission.fileKey)}
                            download
                            className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                          >
                            📎 Download Submitted File
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <ClientGradingWrapper
                      submissionId={submission.id}
                      currentGrade={submission.grade}
                      currentFeedback={submission.feedback}
                      maxPoints={submission.assignment.maxPoints}
                    />
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
