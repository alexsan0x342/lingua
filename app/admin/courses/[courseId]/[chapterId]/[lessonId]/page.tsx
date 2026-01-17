import { adminGetLesson } from "@/app/data/admin/admin-get-lesson";
import { LessonForm } from "./_components/LessonForm";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";

type Params = Promise<{
  courseId: string;
  chapterId: string;
  lessonId: string;
}>;

export default async function LessonIdPage({ params }: { params: Params }) {
  const { chapterId, courseId, lessonId } = await params;
  
  try {
    const lesson = await adminGetLesson(lessonId);
    return <LessonForm data={lesson} chapterId={chapterId} courseId={courseId} />;
  } catch (error) {
    // If lesson doesn't exist, check if the course and chapter still exist
    // and redirect appropriately
    await requireAdmin();
    
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true }
    });
    
    if (!course) {
      notFound(); // Course doesn't exist
    }
    
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true, title: true }
    });
    
    if (!chapter) {
      notFound(); // Chapter doesn't exist
    }
    
    // Lesson doesn't exist, redirect to course edit page
    notFound();
  }
}
