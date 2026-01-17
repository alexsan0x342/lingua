import { getAllCourses } from "@/app/data/course/get-all-courses";
import {
  PublicCourseCard,
  PublicCourseCardSkeleton,
} from "../_components/PublicCourseCard";
import { Suspense } from "react";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

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

export default async function PublicCoursesroute() {
  const { t } = await getTranslations();
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mx-auto text-center">
          {t("common.exploreCourses")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-[700px] mx-auto text-center">
          {t("common.discoverCourses")}
        </p>
      </div>

      <Suspense fallback={<LoadingSkeletonLayout />}>
        <RenderCourses />
      </Suspense>
    </div>
  );
}

async function RenderCourses() {
  const courses = await getAllCourses();
  const { t } = await getTranslations();

  return (
    <div>
      {courses.length === 0 ? (
        <div className="text-center py-10 ">
          <p className="text-muted-foreground">{t("courses.noCoursesAvailable")}</p>
        </div>
      ) : (
        <div className="container mx-auto px-4">
          {/* Large screen: Grid with 2 columns */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-2 max-w-5xl mx-auto">
            {courses.map((course, index) => (
              <div 
                key={course.id} 
                className="animate-in fade-in-50 slide-in-from-left-4 duration-500"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'both'
                }}
              >
                <PublicCourseCard data={course} />
              </div>
            ))}
          </div>

          {/* Tablet: Grid with 2 columns */}
          <div className="hidden md:grid md:grid-cols-2 lg:hidden gap-3">
            {courses.map((course, index) => (
              <div 
                key={course.id}
                className="animate-in fade-in-50 slide-in-from-left-4 duration-500"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'both'
                }}
              >
                <PublicCourseCard data={course} />
              </div>
            ))}
          </div>

          {/* Mobile: Single column stacked */}
          <div className="flex md:hidden flex-col space-y-3">
            {courses.map((course, index) => (
              <div 
                key={course.id}
                className="animate-in fade-in-50 slide-in-from-left-4 duration-500"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'both'
                }}
              >
                <PublicCourseCard data={course} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSkeletonLayout() {
  return (
    <div className="container mx-auto px-4">
      {/* Desktop: Staggered layout */}
      <div className="hidden lg:block">
        <div className="space-y-12">
          {Array.from({ length: 6 }).map((_, index) => (
            <div 
              key={index} 
              className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <div className="w-full max-w-md">
                <PublicCourseCardSkeleton />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tablet: Two columns */}
      <div className="hidden md:block lg:hidden">
        <div className="grid grid-cols-2 gap-8 place-items-center">
          {Array.from({ length: 6 }).map((_, index) => (
            <PublicCourseCardSkeleton key={index} />
          ))}
        </div>
      </div>

      {/* Mobile: Single column */}
      <div className="block md:hidden">
        <div className="flex flex-col items-center space-y-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="w-full max-w-sm">
              <PublicCourseCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
