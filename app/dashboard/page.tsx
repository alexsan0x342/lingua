import { EmptyState } from "@/components/general/EmptyState";
import { getAllCourses } from "../data/course/get-all-courses";
import { getEnrolledCourses } from "../data/user/get-enrolled-courses";
import { PublicCourseCard } from "../(public)/_components/PublicCourseCard";
import { CourseProgressCard } from "./_components/CourseProgressCard";
import LiveLessonsWidget from "@/components/dashboard/LiveLessonsWidget";
import RecordingNotification from "@/components/dashboard/RecordingNotification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Gift, User } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";

// Helper to get translations
async function getTranslations() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return { locale, t: (key: string) => {
    const keys = key.split(".");
    let value: any = messages;
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    return typeof value === "string" ? value : key;
  }};
}

export default async function DashboardPage() {
  const { t } = await getTranslations();
  const [courses, enrolledCourses] = await Promise.all([
    getAllCourses(),
    getEnrolledCourses(),
  ]);

  return (
    <div className="space-y-8">
      {/* Live Lessons Widget */}
      <LiveLessonsWidget />
      
      {/* Enrolled Courses Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.enrolledCourses")}</h1>
          <p className="text-muted-foreground">
            {t("dashboard.continueJourney")}
          </p>
        </div>

        {enrolledCourses.length === 0 ? (
          <EmptyState
            title={t("dashboard.noCoursesYet")}
            description={t("dashboard.noCoursesYetDesc")}
            buttonText={t("dashboard.browseCourses")}
            href="/courses"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course) => (
              <CourseProgressCard key={course.Course.id} data={course} />
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">{t("dashboard.quickActions")}</h2>
          <p className="text-muted-foreground">
            {t("dashboard.accessTools")}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-blue-500" />
                {t("navigation.myCourses")}
              </CardTitle>
              <CardDescription>
                {t("dashboard.continueLearning")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/courses">
                  {t("dashboard.browseCourses")}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gift className="h-5 w-5 text-purple-500" />
                {t("dashboard.redeemCode")}
              </CardTitle>
              <CardDescription>
                {t("dashboard.useRedemptionCode")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/redeem">
                  {t("dashboard.redeemCode")}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-green-500" />
                {t("dashboard.profile")}
              </CardTitle>
              <CardDescription>
                {t("dashboard.manageAccount")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/profile">
                  {t("dashboard.viewProfile")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Available Courses Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">{t("dashboard.availableCourses")}</h2>
          <p className="text-muted-foreground">
            {t("dashboard.discoverNewCourses")}
          </p>
        </div>

        {courses.filter(
          (course) =>
            !enrolledCourses.some(
              ({ Course: enrolled }) => enrolled.id === course.id
            )
        ).length === 0 ? (
          <EmptyState
            title={t("dashboard.noCoursesAvailableTitle")}
            description={t("dashboard.noCoursesAvailableDesc")}
            buttonText={t("dashboard.browseCourses")}
            href="/courses"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses
              .filter(
                (course) =>
                  !enrolledCourses.some(
                    ({ Course: enrolled }) => enrolled.id === course.id
                  )
              )
              .map((course) => (
                <PublicCourseCard key={course.id} data={course} />
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
