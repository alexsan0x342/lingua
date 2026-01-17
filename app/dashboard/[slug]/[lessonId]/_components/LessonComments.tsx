"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  HelpCircle, 
  Send, 
  ThumbsUp, 
  CheckCircle,
  MoreVertical,
  Edit,
  Trash2,
  Reply
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/components/general/I18nProvider";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
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
    name: string;
    image?: string;
    role: string;
  };
}

interface LessonCommentsProps {
  lessonId: string;
  initialComments?: Comment[];
  initialQuestions?: Question[];
  currentUserId: string;
  currentUserRole: string;
}

export function LessonComments({ 
  lessonId, 
  initialComments = [],
  initialQuestions = [],
  currentUserId,
  currentUserRole
}: LessonCommentsProps) {
  const t = useTranslations();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [newComment, setNewComment] = useState("");
  const [newQuestion, setNewQuestion] = useState({ title: "", content: "" });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [answerContent, setAnswerContent] = useState("");
  const [answeringQuestion, setAnsweringQuestion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
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
        toast.error("Failed to load comments and questions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [lessonId]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments([comment, ...comments]);
        setNewComment("");
        toast.success("Comment posted!");
      } else {
        toast.error("Failed to post comment");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostQuestion = async () => {
    if (!newQuestion.title.trim() || !newQuestion.content.trim()) {
      toast.error("Please provide both title and content");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion),
      });

      if (response.ok) {
        const question = await response.json();
        setQuestions([question, ...questions]);
        setNewQuestion({ title: "", content: "" });
        toast.success("Question posted!");
      } else {
        toast.error("Failed to post question");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostReply = async (commentId: string) => {
    if (!replyContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, parentId: commentId }),
      });

      if (response.ok) {
        const reply = await response.json();
        setComments(comments.map(c => 
          c.id === commentId 
            ? { ...c, replies: [...(c.replies || []), reply] }
            : c
        ));
        setReplyContent("");
        setReplyingTo(null);
        toast.success("Reply posted!");
      } else {
        toast.error("Failed to post reply");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostAnswer = async (questionId: string) => {
    if (!answerContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: answerContent }),
      });

      if (response.ok) {
        const answer = await response.json();
        setQuestions(questions.map(q => 
          q.id === questionId 
            ? { ...q, answers: [...(q.answers || []), answer], isAnswered: true }
            : q
        ));
        setAnswerContent("");
        setAnsweringQuestion(null);
        toast.success("Answer posted!");
      } else {
        toast.error("Failed to post answer");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteQuestion = async (questionId: string, delta: number) => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/questions/${questionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });

      if (response.ok) {
        setQuestions(questions.map(q => 
          q.id === questionId ? { ...q, votes: q.votes + delta } : q
        ));
      }
    } catch (error) {
      toast.error("Failed to vote");
    }
  };

  return (
    <div className="mt-8 space-y-4">
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading comments and questions...</div>
            </div>
          </CardContent>
        </Card>
      ) : (
      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t("lessons.comments")} ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            {t("lessons.questions")} ({questions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-4 mt-4">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                {t("lessons.addComment")}
              </CardTitle>
              <CardDescription>{t("lessons.shareThoughts")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={t("lessons.writeComment")}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="resize-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <Button 
                onClick={handlePostComment} 
                disabled={!newComment.trim() || isSubmitting}
                className="w-full sm:w-auto"
                size="default"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? t("lessons.posting") : t("lessons.postComment")}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {comments.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="pt-6 pb-6 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t("lessons.noCommentsYet")}</p>
                </CardContent>
              </Card>
            )}
            {comments.map((comment) => (
              <Card key={comment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 border-2 border-primary/10">
                      <AvatarImage src={comment.user.image} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {comment.user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-base">{comment.user.name}</span>
                          {comment.user.role === "ADMIN" && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                              <span className="mr-1">✓</span> Instructor
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/90">{comment.content}</p>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setReplyingTo(comment.id)}
                          className="h-8 text-xs"
                        >
                          <Reply className="h-3 w-3 mr-1.5" />
                          Reply
                        </Button>
                        {comment.replies && comment.replies.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                          </span>
                        )}
                      </div>
                      
                      {replyingTo === comment.id && (
                        <div className="space-y-3 mt-3 p-4 bg-muted/50 rounded-lg border border-border/50">
                          <Textarea
                            placeholder="Write your reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            rows={2}
                            className="resize-none bg-background"
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => handlePostReply(comment.id)}
                              disabled={!replyContent.trim() || isSubmitting}
                            >
                              <Send className="h-3 w-3 mr-1.5" />
                              {isSubmitting ? "Posting..." : "Post Reply"}
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="space-y-3 mt-4 pl-4 border-l-2 border-primary/30">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              <Avatar className="h-8 w-8 border border-border">
                                <AvatarImage src={reply.user.image} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {reply.user.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm">{reply.user.name}</span>
                                  {reply.user.role === "ADMIN" && (
                                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                      <span className="mr-0.5">✓</span> Instructor
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-sm leading-relaxed text-foreground/90">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4 mt-4">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Ask a Question
              </CardTitle>
              <CardDescription>Get help from instructors and other students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question-title" className="text-sm font-semibold">Title</Label>
                <Input
                  id="question-title"
                  placeholder="Brief summary of your question..."
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                  className="focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="question-content" className="text-sm font-semibold">Details</Label>
                <Textarea
                  id="question-content"
                  placeholder="Provide more details about your question..."
                  value={newQuestion.content}
                  onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                  rows={4}
                  className="resize-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <Button 
                onClick={handlePostQuestion} 
                disabled={!newQuestion.title.trim() || !newQuestion.content.trim() || isSubmitting}
                className="w-full sm:w-auto"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                {isSubmitting ? "Posting..." : "Post Question"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {questions.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="pt-6 pb-6 text-center text-muted-foreground">
                  <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No questions yet. Be the first to ask!</p>
                </CardContent>
              </Card>
            )}
            {questions.map((question) => (
              <Card key={question.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base leading-tight">{question.title}</CardTitle>
                        {question.isAnswered && (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Answered
                          </Badge>
                        )}
                        {question.isResolved && (
                          <Badge variant="outline" className="border-green-600 text-green-600">
                            Resolved
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
                        {question.answers && question.answers.length > 0 && (
                          <>
                            <span className="text-xs">•</span>
                            <span className="text-xs">{question.answers.length} {question.answers.length === 1 ? 'answer' : 'answers'}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleVoteQuestion(question.id, 1)}
                        className="h-9 px-3 hover:bg-primary/10 hover:border-primary/50"
                      >
                        <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                        <span className="font-semibold">{question.votes}</span>
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
                        <div key={answer.id} className="space-y-2 p-4 rounded-lg bg-muted/30 border-l-4 border-primary/30">
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
                                <span className="mr-0.5">✓</span> Instructor
                              </Badge>
                            )}
                            {answer.isAccepted && (
                              <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Accepted Answer
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{answer.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {answeringQuestion === question.id ? (
                    <div className="space-y-3 pt-4 border-t border-border/50 p-4 bg-muted/30 rounded-lg">
                      <Label className="text-sm font-semibold">Your Answer</Label>
                      <Textarea
                        placeholder="Write your answer..."
                        value={answerContent}
                        onChange={(e) => setAnswerContent(e.target.value)}
                        rows={3}
                        className="resize-none bg-background"
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => handlePostAnswer(question.id)}
                          disabled={!answerContent.trim() || isSubmitting}
                        >
                          <Send className="h-3 w-3 mr-1.5" />
                          {isSubmitting ? "Posting..." : "Post Answer"}
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAnsweringQuestion(null);
                            setAnswerContent("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setAnsweringQuestion(question.id)}
                      className="hover:bg-primary/10 hover:border-primary/50"
                    >
                      <Reply className="h-3 w-3 mr-1.5" />
                      Answer Question
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}
