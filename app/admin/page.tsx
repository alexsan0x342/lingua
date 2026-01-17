import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive";
import { SectionCards } from "@/components/sidebar/section-cards";
import { adminGetEnrollmentStats } from "../data/admin/admin-get-enrollment-stats";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { adminGetRecentCourses } from "../data/admin/admin-get-recent-courses";
import { EmptyState } from "@/components/general/EmptyState";
import {
  AdminCourseCard,
  AdminCourseCardSkeleton,
} from "./courses/_components/AdminCourseCard";
import { Suspense } from "react";
import { requireAdmin } from "../data/admin/require-admin";
import { redirect } from "next/navigation";

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

export default async function AdminIndexPage() {
  const session = await requireAdmin();
  const userRole = session.user.role;
  
  // Redirect MANAGER users to their custom dashboard
  if (userRole === 'MANAGER') {
    redirect('/admin/manager-dashboard');
  }
  
  // Handle case where user role is not properly set
  if (!userRole || userRole !== 'ADMIN') {
    redirect('/not-admin');
  }
  
  // Only ADMIN sees the main admin dashboard
  const enrollmentData = await adminGetEnrollmentStats();
  
  return (
    <>
      {/* Show SectionCards for all admin users */}
   



      {/* Show recent courses only for ADMIN */}
      {userRole === 'ADMIN' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Courses</h2>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/admin/courses"
            >
              View All Courses
            </Link>
          </div>

          <Suspense fallback={<RenderRecentCoursesSkeletonLayout />}>
            <RenderRecentCourses />
          </Suspense>
        </div>
      )}
    </>
  );
}

async function RenderRecentCourses() {
  const data = await adminGetRecentCourses();

  if (data.length === 0) {
    return (
      <EmptyState
        buttonText="Create new Course"
        description="you dont have any courses. create some to see them here"
        title="You dont have any courses yet!"
        href="/admin/courses/create"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
      {data.map((course) => (
        <AdminCourseCard key={course.id} data={course} />
      ))}
    </div>
  );
}

function RenderRecentCoursesSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
      {Array.from({ length: 3 }).map((_, index) => (
        <AdminCourseCardSkeleton key={index} />
      ))}
    </div>
  );
}
