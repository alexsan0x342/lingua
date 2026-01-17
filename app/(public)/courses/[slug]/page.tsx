import { getIndividualCourse } from "@/app/data/course/get-course";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { env } from "@/lib/env";
import {
  IconBook,
  IconCategory,
  IconChartBar,
  IconChevronDown,
  IconClock,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { CheckIcon } from "lucide-react";
import Image from "next/image";
import { checkIfCourseBought } from "@/app/data/user/user-is-enrolled";
import Link from "next/link";
import { InlineCourseRedemption } from "./_components/InlineCourseRedemption";
import { GuestPaymentWrapper } from "@/components/guest-payment-wrapper";
import { GuestCodeRedemption } from "@/components/guest-code-redemption";
import { buttonVariants } from "@/components/ui/button";
import { STRIPE_ENABLED } from "@/lib/stripe";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { constructUrl } from "@/hooks/use-construct-url";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { LockedLessonNotification } from "./_components/LockedLessonNotification";

type Params = Promise<{ slug: string }>;

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

export default async function SlugPage({ params }: { params: Params }) {
  const { slug } = await params;
  const course = await getIndividualCourse(slug);
  const isEnrolled = await checkIfCourseBought(course.id);
  const { locale, t } = await getTranslations();
  
  // Check if user is logged in for free lesson access
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isAuthenticated = !!session?.user;

  const thumbnailUrl = constructUrl(course.fileKey);

  return (
    <>
      <LockedLessonNotification 
        lockedMessage={t("lessons.lockedMessage")}
        lockedTitle={t("lessons.locked")}
      />
      <div className="grid grid-cols-1 gap-8 lg:gap-12 lg:grid-cols-3">
      <div className="order-1 lg:col-span-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl lg:rounded-2xl shadow-2xl">
          <Image
            src={thumbnailUrl}
            alt={`Course thumbnail for ${course.title}`}
            fill
            className="object-cover transition-all duration-500"
            priority
            unoptimized={thumbnailUrl.startsWith('/api/') || thumbnailUrl.includes('cdn.lingua-ly.com')}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        </div>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
              {course.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {course.smallDescription}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-2">
              <IconChartBar className="size-4" />
              <span>{t(`courses.${course.level.toLowerCase()}`)}</span>
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2">
              <IconCategory className="size-4" />
              <span>
                {locale === 'ar' && course.courseCategory?.nameAr 
                  ? course.courseCategory.nameAr 
                  : course.courseCategory?.name || course.category}
              </span>
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2">
              <IconClock className="size-4" />
              <span>{course.duration} {t("courses.hours")}</span>
            </Badge>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">
              {t("courses.courseDescription")}
            </h2>

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <RenderDescription json={JSON.parse(course.description)} />
            </div>
          </div>
        </div>

        <div className="mt-12 lg:mt-16 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">
              {t("courses.courseContentDetails")}
            </h2>
            <div className="text-base text-muted-foreground font-medium">
              {course.chapter.length} {t("courses.chapters")} • {" "}
              {course.chapter.reduce(
                (total, chapter) => total + chapter.lessons.length,
                0
              ) || 0}{" "}
              {t("lessons.lessons")}
            </div>
          </div>

          <div className="space-y-6">
            {course.chapter.map((chapter, index) => (
              <Collapsible key={chapter.id} defaultOpen={index === 0}>
                <Card className="p-0 overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
                  <CollapsibleTrigger className="w-full">
                    <CardContent className="p-6 lg:p-8 hover:bg-muted/30 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 lg:gap-6">
                          <div className="flex size-12 lg:size-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 text-primary font-bold text-lg lg:text-xl border-2 border-primary/20">
                            {index + 1}
                          </div>
                          <div className="text-left">
                            <h3 className="text-xl lg:text-2xl font-semibold">
                              {chapter.title}
                            </h3>
                            <p className="text-sm lg:text-base text-muted-foreground mt-2">
                              {chapter.lessons.length} {t("lessons.lesson")}{chapter.lessons.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        <IconChevronDown className="size-6 text-muted-foreground transition-transform duration-200" />
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t bg-gradient-to-b from-muted/10 to-muted/30">
                      <div className="p-6 lg:p-8 space-y-4">
                        {chapter.lessons.map((lesson, lessonIndex) => {
                          const content = (
                            <>
                              <div className="flex size-10 lg:size-12 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
                                <IconPlayerPlay className="size-4 lg:size-5 text-primary" />
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-base lg:text-lg">
                                    {lesson.title}
                                  </p>
                                  {lesson.isFree && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                      {t("lessons.free")}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {t("lessons.lesson")} {lessonIndex + 1}
                                </p>
                              </div>
                            </>
                          );
                          
                          return lesson.isFree ? (
                            <Link
                              key={lesson.id}
                              href={isAuthenticated ? `/dashboard/${course.slug}/${lesson.id}` : `/login?redirect=/dashboard/${course.slug}/${lesson.id}`}
                              className="flex items-center gap-4 lg:gap-6 rounded-xl p-4 lg:p-5 hover:bg-accent/50 transition-all duration-200 border border-transparent hover:border-primary/10 cursor-pointer"
                            >
                              {content}
                            </Link>
                          ) : (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-4 lg:gap-6 rounded-xl p-4 lg:p-5 hover:bg-accent/50 transition-all duration-200 border border-transparent hover:border-primary/10"
                            >
                              {content}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </div>
      </div>

      {/* Enrollment Card */}
      <div className="order-2 lg:col-span-1">
        <div className="sticky top-6 lg:top-24">
          <Card className="border-2 border-primary/10 shadow-xl">
            <CardContent className="p-6 lg:p-8">
              <div className="text-center mb-8">
                <p className="text-sm font-medium text-muted-foreground mb-2">{t("courses.coursePrice")}</p>
                <div className="text-4xl lg:text-5xl font-bold text-primary mb-4">
                  {course.price} LYD
                </div>
                <p className="text-sm text-muted-foreground">{t("courses.oneTimePayment")}</p>
              </div>

              <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
                <h4 className="mb-4 font-semibold text-card-foreground">{t("courses.courseOverview")}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconClock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t("courses.duration")}</span>
                    </div>
                    <span className="font-medium text-sm">{course.duration}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconBook className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t("lessons.lessons")}</span>
                    </div>
                    <span className="font-medium text-sm">
                      {course.chapter.reduce(
                        (total, chapter) => total + chapter.lessons.length,
                        0
                      ) || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-8 space-y-4">
                <h4 className="font-semibold text-lg">{t("courses.whatsIncluded")}</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm">
                    <div className="rounded-full p-1.5 bg-primary/10 text-primary">
                      <CheckIcon className="size-4" />
                    </div>
                    <span>{t("courses.fullLifetimeAccess")}</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="rounded-full p-1.5 bg-primary/10 text-primary">
                      <CheckIcon className="size-4" />
                    </div>
                    <span>{t("courses.mobileDesktopAccess")}</span>
                  </li>

                </ul>
              </div>

              {isEnrolled ? (
                <Link
                  className={buttonVariants({ className: "w-full h-12 lg:h-10 text-sm lg:text-base" })}
                  href="/dashboard"
                >
                  {t("courses.watchCourse")}
                </Link>
              ) : (
                <div className="space-y-4">
                  {STRIPE_ENABLED ? (
                    <Tabs defaultValue="payment" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="payment">{t("courses.buyNow")}</TabsTrigger>
                        <TabsTrigger value="code">{t("courses.useCode")}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="payment" className="mt-4">
                        <GuestPaymentWrapper
                          courseId={course.id}
                          courseTitle={course.title}
                          amount={Math.round(course.price * 100)} // Convert to cents
                        />
                      </TabsContent>
                      <TabsContent value="code" className="mt-4">
                        <GuestCodeRedemption compact={true} />
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <GuestCodeRedemption />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
