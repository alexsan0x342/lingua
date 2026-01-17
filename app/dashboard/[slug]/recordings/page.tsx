import { notFound } from "next/navigation";
import { getCourseSidebarData } from "@/app/data/course/get-course-sidebar-data";
import { CourseRecordingsPage } from "./_components/CourseRecordingsPage";

type Params = Promise<{ slug: string }>;

export default async function RecordingsPage({ params }: { params: Params }) {
  const { slug } = await params;
  
  try {
    const { course } = await getCourseSidebarData(slug);
    return <CourseRecordingsPage courseSlug={slug} courseTitle={course.title} />;
  } catch (error) {
    return notFound();
  }
}
