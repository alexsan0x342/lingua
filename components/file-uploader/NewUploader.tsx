"use client";

import { BulletproofUploader } from "./BulletproofUploader";

interface NewUploaderProps {
  onChange?: (key: string) => void;
  value?: string;
  fileTypeAccepted: "image" | "video";
  lessonId?: string;
}

export function NewUploader({ onChange, value, fileTypeAccepted, lessonId }: NewUploaderProps) {
  if (!lessonId) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500">Lesson ID is required for uploads</p>
      </div>
    );
  }

  return (
    <BulletproofUploader
      lessonId={lessonId}
      fileType={fileTypeAccepted}
      onUploadComplete={(key) => onChange?.(key)}
      currentKey={value}
    />
  );
}




