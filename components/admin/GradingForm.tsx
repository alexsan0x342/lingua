"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Award } from "lucide-react";
import { toast } from "sonner";

interface GradingFormProps {
  submissionId: string;
  currentGrade: number | null;
  currentFeedback: string | null;
  maxPoints: number | null;
  onGradeUpdated: () => void;
}

export function GradingForm({ 
  submissionId, 
  currentGrade, 
  currentFeedback, 
  maxPoints,
  onGradeUpdated 
}: GradingFormProps) {
  const [grade, setGrade] = useState(currentGrade?.toString() || "");
  const [feedback, setFeedback] = useState(currentFeedback || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!grade) {
      toast.error("Please enter a grade");
      return;
    }

    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0) {
      toast.error("Please enter a valid grade");
      return;
    }

    if (maxPoints && gradeNum > maxPoints) {
      toast.error(`Grade cannot exceed ${maxPoints} points`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId,
          grade: gradeNum,
          feedback: feedback.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update grade");
      }

      const result = await response.json();
      
      toast.success(
        `Grade saved successfully! ${
          result.pointsAdjusted !== 0 
            ? `Points adjusted: ${result.pointsAdjusted > 0 ? '+' : ''}${result.pointsAdjusted}`
            : ''
        }`
      );
      
      onGradeUpdated();
    } catch (error) {
      console.error("Error updating grade:", error);
      toast.error("Failed to save grade");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor={`grade-${submissionId}`}>Grade (Points)</Label>
        <Input
          id={`grade-${submissionId}`}
          type="number"
          min="0"
          max={maxPoints || undefined}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          placeholder="Enter points"
        />
        {maxPoints && (
          <p className="text-xs text-muted-foreground mt-1">
            Max: {maxPoints} points
          </p>
        )}
      </div>
      
      <div>
        <Label htmlFor={`feedback-${submissionId}`}>Feedback (Optional)</Label>
        <Textarea
          id={`feedback-${submissionId}`}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Add feedback for the student"
          rows={3}
        />
      </div>
      
      <Button 
        type="submit" 
        size="sm" 
        disabled={isSubmitting}
        className="w-full"
      >
        <Award className="w-4 h-4 mr-2" />
        {isSubmitting ? "Saving..." : "Save Grade"}
      </Button>
    </form>
  );
}
