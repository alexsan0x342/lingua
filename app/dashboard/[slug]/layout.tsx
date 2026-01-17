import { ReactNode } from "react";
import { CourseSidebar } from "../_components/CourseSidebar";
import { getCourseSidebarData } from "@/app/data/course/get-course-sidebar-data";

interface iAppProps {
  params: Promise<{ slug: string }>;
  children: ReactNode;
}

export default async function CourseLayout({ children, params }: iAppProps) {
  const { slug } = await params;

  // Server-side security check and lightweight data fetching
  const course = await getCourseSidebarData(slug);

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* Mobile Course Navigation - Hidden on desktop */}
      <div className="lg:hidden border-b border-border bg-background">
        <CourseSidebar course={course.course} />
      </div>

      {/* Desktop sidebar - Hidden on mobile */}
      <div className="hidden lg:block w-80 border-r border-border shrink-0">
        <CourseSidebar course={course.course} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden min-h-0 pt-4 lg:pt-0">{children}</div>
    </div>
  );
}
