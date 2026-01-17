"use client";

import * as React from "react";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconFolder,
  IconHelp,
  IconListDetails,
  IconSettings,
  IconUsers as IconUsersTabler,
  IconVideo,
  IconBook,
  IconFileText,
  IconBug,
  IconRefresh,
  IconTools,
  IconMail,
  IconPalette,
  IconHome,
  IconAlertCircle,
  IconGift,
  IconReceipt,
  IconDeviceMobile,
  IconShield,
  IconBell,
  IconLock,
  IconCategory,
  IconMovie,
} from "@tabler/icons-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavAdmin } from "@/components/sidebar/nav-admin";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { UserRole } from "@/lib/rbac";
import { hasDynamicPermission } from "@/lib/dynamic-rbac";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { LanguageToggle } from "@/components/general/LanguageToggle";
import { useTranslations } from "@/components/general/I18nProvider";

// Function to generate navigation data with translations
const getAdminData = (t: (key: string) => string) => ({
  navMain: [
    {
      title: t("navigation.dashboard"),
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: t("navigation.users"),
      url: "/admin/users",
      icon: IconUsersTabler,
    },
    {
      title: t("navigation.courses"),
      url: "/admin/courses",
      icon: IconListDetails,
    },
    {
      title: t("navigation.categories"),
      url: "/admin/categories",
      icon: IconCategory,
    },
    {
      title: t("navigation.analytics"),
      url: "/admin/business",
      icon: IconChartBar,
    },
    {
      title: t("navigation.codes"),
      url: "/admin/codes",
      icon: IconGift,
    },
    {
      title: t("navigation.liveLessons"),
      url: "/admin/live-lessons",
      icon: IconVideo,
    },
    {
      title: t("navigation.submissions"),
      url: "/admin/submissions",
      icon: IconFileDescription,
    },
    {
      title: t("navigation.emailManager"),
      url: "/admin/emails",
      icon: IconMail,
    },
    {
      title: t("navigation.deviceTracking"),
      url: "/admin/device-tracking",
      icon: IconDeviceMobile,
    },
  ],
  navAdmin: [],
  navSecondary: [],
});

const getUserData = (t: (key: string) => string) => ({
  navMain: [
    {
      title: t("navigation.dashboard"),
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: t("navigation.myCourses"),
      url: "/dashboard/courses",
      icon: IconBook,
    },
    {
      title: t("navigation.liveLessons"),
      url: "/dashboard/live-lessons",
      icon: IconVideo,
    },
    {
      title: t("navigation.recordings"),
      url: "/dashboard/recordings",
      icon: IconMovie,
    },
    {
      title: t("navigation.redeemCode"),
      url: "/dashboard/redeem",
      icon: IconGift,
    },
    {
      title: t("navigation.profile"),
      url: "/dashboard/profile",
      icon: IconUsersTabler,
    },
    {
      title: t("navigation.settings"),
      url: "/settings",
      icon: IconSettings,
      items: [
        {
          title: t("navigation.profile"),
          url: "/settings/profile",
        },
        {
          title: t("navigation.security"),
          url: "/settings/security",
        },
        {
          title: t("navigation.notifications"),
          url: "/settings/notifications",
        },
      ],
    },
  ],
  navAdmin: [],
  navSecondary: [],
});

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { session } = useSession();
  const pathname = usePathname();
  const { settings: siteSettings } = useSiteSettings();
  const [logoError, setLogoError] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const t = useTranslations();

  // Mark component as mounted to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Use consistent default for SSR - only use site settings logo after mounted
  const logoUrl = !mounted
    ? "/logo.svg"
    : logoError
      ? "/logo.svg"
      : siteSettings?.logo_url || "/logo.svg";

  // Handle logo load error
  const handleLogoError = () => {
    setLogoError(true);
  };

  // Check if we're in admin area - use useMemo to ensure stable reference
  const isAdminArea = React.useMemo(() => {
    return Boolean(pathname?.startsWith("/admin"));
  }, [pathname]);

  // Get navigation data with translations
  const adminData = React.useMemo(() => getAdminData(t), [t]);
  const userData = React.useMemo(() => {
    const baseData = getUserData(t);

    // Add Admin Panel for admins/managers
    const userRole = session?.user?.role;
    if (userRole && ["ADMIN", "MANAGER"].includes(userRole)) {
      baseData.navMain.push({
        title: t("navigation.adminPanel") || "Admin Panel",
        url: "/admin",
        icon: IconShield,
      });
    }

    return baseData;
  }, [t, session?.user?.role]);

  // Choose the appropriate navigation data based on area
  const currentData = React.useMemo(() => {
    return isAdminArea ? adminData : userData;
  }, [isAdminArea, adminData, userData]);

  // Filter navigation items based on user role and dynamic permissions (only for admin area)
  const getFilteredNavItems = React.useCallback(() => {
    if (!session?.user?.role) return currentData.navMain;

    // For user dashboard, show all items
    if (!isAdminArea) {
      return currentData.navMain;
    }

    // For admin area, apply role-based filtering
    const userRole = session.user.role as UserRole;
    const allNavItems = currentData.navMain;

    return allNavItems.filter((item) => {
      switch (item.title) {
        case "Live Lessons":
          return (
            hasDynamicPermission(userRole, "live_lessons_view") ||
            hasDynamicPermission(userRole, "live_lessons_create")
          );
        case "Courses":
          return (
            hasDynamicPermission(userRole, "courses_view") ||
            hasDynamicPermission(userRole, "courses_create")
          );
        case "Analytics":
          return (
            hasDynamicPermission(userRole, "analytics_view_all") ||
            hasDynamicPermission(userRole, "courses_analytics")
          );
        case "Business":
          return userRole === "ADMIN";
        case "Codes":
          return userRole === "ADMIN";
        case "Costs":
          return userRole === "ADMIN";
        case "Device Tracking":
          return userRole === "ADMIN"; // Only admins can see device tracking
        case "Email Manager":
          return userRole === "ADMIN"; // Only admins can send emails
        case "Users":
          return (
            hasDynamicPermission(userRole, "users_view") ||
            hasDynamicPermission(userRole, "users_manage_roles")
          );
        case "Submissions":
          return (
            hasDynamicPermission(userRole, "analytics_view_all") ||
            hasDynamicPermission(userRole, "courses_analytics")
          );
        case "Dashboard":
          return hasDynamicPermission(userRole, "admin_panel");
        default:
          // For other items, check if user has admin panel access
          return hasDynamicPermission(userRole, "admin_panel");
      }
    });
  }, [session?.user?.role, currentData.navMain, isAdminArea]);

  const filteredNavItems = React.useMemo(
    () => getFilteredNavItems(),
    [getFilteredNavItems],
  );

  // Return loading skeleton until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader className="border-b border-sidebar-border bg-sidebar">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between w-full gap-2">
                <Link
                  href="/"
                  className="flex items-center gap-2 p-2 rounded-md transition-all duration-200 w-fit group"
                >
                  <div className="relative flex items-center">
                    <img
                      src="/logo.svg"
                      alt="Logo"
                      className="h-6 w-auto object-contain transition-transform duration-200 group-hover:scale-125"
                    />
                  </div>
                </Link>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border bg-sidebar p-2">
          <div className="h-10 bg-muted rounded animate-pulse"></div>
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full gap-2">
              <Link
                href="/"
                className="flex items-center gap-2 p-2 rounded-md transition-all duration-200 w-fit group"
              >
                <div className="relative flex items-center">
                  <img
                    src={logoUrl}
                    alt={siteSettings?.site_name || "Logo"}
                    className="h-6 w-auto object-contain transition-transform duration-200 group-hover:scale-125"
                    onError={handleLogoError}
                  />
                </div>
              </Link>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavItems} />
        <NavSecondary
          items={currentData.navSecondary}
          className="mt-auto border-t border-sidebar-border pt-2"
        />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border bg-sidebar p-2 space-y-2">
        {!isAdminArea && <LanguageToggle />}
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
