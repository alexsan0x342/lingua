"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, HelpCircle, Trash2, CheckCircle, Ban, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
    role: string;
  };
  replies?: Comment[];
}

interface Question {
  id: string;
  title: string;
  content: string;
  isAnswered: boolean;
  isResolved: boolean;
  votes: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
    role: string;
  };
  answers?: Answer[];
}

interface Answer {
  id: string;
  content: string;
  isAccepted: boolean;
  isTutorReply: boolean;
  votes: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
    role: string;
  };
}

interface LessonModerationProps {
  lessonId: string;
}

export function LessonModeration({ lessonId }: LessonModerationProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'comment' | 'question' | 'answer'; id: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [lessonId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [commentsRes, questionsRes] = await Promise.all([
        fetch(`/api/lessons/${lessonId}/comments`),
        fetch(`/api/lessons/${lessonId}/questions`),
      ]);

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData);
      }

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setQuestions(questionsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load moderation data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;

    setIsDeleting(true);
    try {
      let endpoint = '';
      if (deleteDialog.type === 'comment') {
        endpoint = `/api/admin/comments/${deleteDialog.id}`;
      } else if (deleteDialog.type === 'question') {
        endpoint = `/api/admin/questions/${deleteDialog.id}`;
      } else if (deleteDialog.type === 'answer') {
        endpoint = `/api/admin/answers/${deleteDialog.id}`;
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(`${deleteDialog.type.charAt(0).toUpperCase() + deleteDialog.type.slice(1)} deleted successfully`);
        fetchData(); // Refresh data
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
      setDeleteDialog(null);
    }
  };

  const handleMarkResolved = async (questionId: string, resolved: boolean) => {
    try {
      const response = await fetch(`/api/admin/questions/${questionId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: resolved }),
      });

      if (response.ok) {
        toast.success(`Question marked as ${resolved ? 'resolved' : 'unresolved'}`);
        fetchData();
      } else {
        toast.error('Failed to update question');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const getTotalCount = () => {
    const commentCount = comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0);
    const questionCount = questions.length;
    const answerCount = questions.reduce((acc, q) => acc + (q.answers?.length || 0), 0);
    return { commentCount, questionCount, answerCount, total: commentCount + questionCount + answerCount };
  };

  const counts = getTotalCount();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6 text-center">
          <p className="text-muted-foreground">Loading moderation data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.commentCount}</div>
            <p className="text-xs text-muted-foreground">
              Total comments and replies
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.questionCount}</div>
            <p className="text-xs text-muted-foreground">
              {questions.filter(q => !q.isAnswered).length} unanswered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Answers</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.answerCount}</div>
            <p className="text-xs text-muted-foreground">
              Total answers provided
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comments">
            Comments ({counts.commentCount})
          </TabsTrigger>
          <TabsTrigger value="questions">
            Questions ({counts.questionCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-4 mt-4">
          {comments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 pb-6 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No comments on this lesson yet</p>
              </CardContent>
            </Card>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 border-2 border-primary/10">
                      <AvatarImage src={comment.user.image} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {comment.user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-base">{comment.user.name}</span>
                          {comment.user.role === "ADMIN" && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              Instructor
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, type: 'comment', id: comment.id })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/90">{comment.content}</p>

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="space-y-3 mt-4 pl-4 border-l-2 border-primary/30">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                              <Avatar className="h-8 w-8 border border-border">
                                <AvatarImage src={reply.user.image} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {reply.user.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm">{reply.user.name}</span>
                                    {reply.user.role === "ADMIN" && (
                                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                        Instructor
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteDialog({ open: true, type: 'comment', id: reply.id })}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                                <p className="text-sm leading-relaxed text-foreground/90 mt-1">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="questions" className="space-y-4 mt-4">
          {questions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 pb-6 text-center text-muted-foreground">
                <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No questions on this lesson yet</p>
              </CardContent>
            </Card>
          ) : (
            questions.map((question) => (
              <Card key={question.id}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base leading-tight">{question.title}</CardTitle>
                        {question.isAnswered && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Answered
                          </Badge>
                        )}
                        {question.isResolved && (
                          <Badge variant="outline" className="border-green-600 text-green-600">
                            Resolved
                          </Badge>
                        )}
                        {!question.isAnswered && (
                          <Badge variant="outline" className="border-orange-600 text-orange-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Needs Answer
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        <Avatar className="h-7 w-7 border border-border">
                          <AvatarImage src={question.user.image} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {question.user.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{question.user.name}</span>
                        <span className="text-xs">•</span>
                        <span className="text-xs">{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</span>
                        <span className="text-xs">•</span>
                        <span className="text-xs">{question.votes} votes</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={question.isResolved ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleMarkResolved(question.id, !question.isResolved)}
                      >
                        {question.isResolved ? (
                          <>
                            <Ban className="h-3 w-3 mr-1" />
                            Unresolve
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Resolved
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, type: 'question', id: question.id })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{question.content}</p>

                  {question.answers && question.answers.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-border/50">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        {question.answers.length} {question.answers.length === 1 ? "Answer" : "Answers"}
                      </h4>
                      {question.answers.map((answer) => (
                        <div key={answer.id} className="p-4 rounded-lg bg-muted/30 border-l-4 border-primary/30">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Avatar className="h-7 w-7 border border-border">
                                <AvatarImage src={answer.user.image} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {answer.user.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-semibold text-sm">{answer.user.name}</span>
                              {answer.isTutorReply && (
                                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                  Instructor
                                </Badge>
                              )}
                              {answer.isAccepted && (
                                <Badge variant="default" className="bg-green-600 text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Accepted
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteDialog({ open: true, type: 'answer', id: answer.id })}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{answer.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialog?.open} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {deleteDialog?.type}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
