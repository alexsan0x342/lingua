"use client";

import { GradingForm } from "@/components/admin/GradingForm";

interface ClientGradingWrapperProps {
  submissionId: string;
  currentGrade: number | null;
  currentFeedback: string | null;
  maxPoints: number | null;
}

export function ClientGradingWrapper({ 
  submissionId, 
  currentGrade, 
  currentFeedback, 
  maxPoints 
}: ClientGradingWrapperProps) {
  const handleGradeUpdated = () => {
    // Refresh the page to show updated data
    window.location.reload();
  };

  return (
    <GradingForm
      submissionId={submissionId}
      currentGrade={currentGrade}
      currentFeedback={currentFeedback}
      maxPoints={maxPoints}
      onGradeUpdated={handleGradeUpdated}
    />
  );
}
