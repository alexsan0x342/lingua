import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteSettings } from "@/lib/site-settings";
import { prisma } from "@/lib/db";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import Link from "next/link";
import { cookies } from "next/headers";

interface featureProps {
  title: string;
  description: string;
  icon: string;
  isRichText?: boolean;
}

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

const features: featureProps[] = [
  {
    title: "Comprehensive Courses",
    description:
      "Access a wide range of carefully curated courses designed by industry experts.",
    icon: "📚",
  },
  {
    title: "Interactive Learning",
    description:
      "Engage with interactive content, quizzes, and assignments to enhance your learning experience.",
    icon: "🎮",
  },
  {
    title: "Progress Tracking",
    description:
      "Monitor your progress and achievements with detailed analytics and personalized dashboards.",
    icon: "📊",
  },
  {
    title: "Community Support",
    description:
      "Join a vibrant community of learners and instructors to collaborate and share knowledge.",
    icon: "👥",
  },
];

export default async function Home() {
  const { locale, t } = await getTranslations();
  let siteSettings;
  let homeContent: any[] = [];

  // Helper function to safely render content (handles both plain text and JSON)
  const renderContent = (contentString: string | null, fallback: string = "") => {
    if (!contentString) return <p>{fallback}</p>;
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(contentString);
      return <RenderDescription json={parsed} />;
    } catch {
      // If parsing fails, treat as plain text
      return <p>{contentString}</p>;
    }
  };

  try {
    siteSettings = await getSiteSettings();
    
    // Get homepage content from database
    homeContent = await prisma.homePageContent.findMany({
      where: { isVisible: true },
      orderBy: { position: 'asc' }
    });
  } catch {
    // Use default settings during build
    siteSettings = {
      site_name: "Marshal LMS",
      site_description: "Modern Learning Management System"
    };
  }
  
  // Get hero section (main banner)
  const heroSection = homeContent.find(section => 
    section.section.includes('hero')
  );

  // Get features sections
  const featureSections = homeContent.filter(section => 
    section.section.includes('features')
  );

  // Always use translations for features (ignore database custom sections for now)
  const dynamicFeatures = [
    {
      title: t("homepage.comprehensiveCourses"),
      description: t("homepage.comprehensiveCoursesDesc"),
      icon: "📚",
      isRichText: false
    },
    {
      title: t("homepage.interactiveLearning"),
      description: t("homepage.interactiveLearningDesc"),
      icon: "🎮",
      isRichText: false
    },
    {
      title: t("homepage.progressTracking"),
      description: t("homepage.progressTrackingDesc"),
      icon: "📊",
      isRichText: false
    },
    {
      title: t("homepage.communitySupport"),
      description: t("homepage.communitySupportDesc"),
      icon: "👥",
      isRichText: false
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-8 sm:py-12 md:py-16 lg:py-24 xl:py-32">
        <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6 md:space-y-8 max-w-5xl mx-auto px-4 sm:px-6">
          <Badge variant="secondary" className="px-3 py-1.5 text-xs sm:text-sm">
            {t("common.siteDescription")}
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight">
            {`${t("homepage.welcomeTo")} ${siteSettings.site_name}`}
          </h1>
          <div className="max-w-[600px] lg:max-w-[700px] text-sm sm:text-base md:text-lg text-muted-foreground px-2 sm:px-4 text-center">
            {t("homepage.discoverNewWay")}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 sm:pt-4 w-full sm:w-auto px-2 sm:px-4 md:px-0">
            <Link
              className={buttonVariants({
                size: "lg",
                className: "px-6 sm:px-8 h-11 md:h-12 text-sm sm:text-base w-full sm:w-auto",
              })}
              href="/courses"
            >
              {t("common.exploreCourses")}
            </Link>
            <Link
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "px-6 sm:px-8 h-11 md:h-12 text-sm sm:text-base w-full sm:w-auto",
              })}
              href="/dashboard"
            >
              {t("navigation.dashboard")}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 px-3 sm:px-4 md:px-6">
        <div className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12">
          <div className="text-center space-y-2 sm:space-y-3 md:space-y-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-center px-2">
              {t("homepage.whyChoose")}
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-[600px] lg:max-w-[700px] mx-auto px-3 sm:px-4 text-center">
              {t("homepage.everythingYouNeed")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 max-w-7xl mx-auto">
            {dynamicFeatures.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden transition-all duration-300 hover:shadow-lg group text-center">
                <CardHeader className="pb-3 sm:pb-4 flex flex-col items-center space-y-2">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-base sm:text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center px-4 sm:px-6">
                  <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-center">
                    {feature.isRichText ? renderContent(feature.description, feature.description) : feature.description}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
