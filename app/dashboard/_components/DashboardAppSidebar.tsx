"use client";

import * as React from "react";
import {
  IconCamera,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconHelp,
  IconSettings,
  IconVideo,
  IconBook,
  IconGift,
  IconUser,
  IconShield,
} from "@tabler/icons-react";
import { 
  BookOpen, 
  Gift, 
  Award,
  User
} from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
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
import { useSession } from "@/hooks/use-session";
import { useSiteSettings } from "@/hooks/use-site-settings";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "My Courses",
      url: "/courses",
      icon: IconBook,
    },
    {
      title: "Redeem Code",
      url: "/dashboard/redeem",
      icon: IconGift,
    },
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: IconUser,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { session, loading } = useSession();
  const { settings: siteSettings } = useSiteSettings();
  const [mounted, setMounted] = React.useState(false);
  
  // Mark component as mounted to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Debug: Log session to check role
  React.useEffect(() => {
    if (mounted && !loading) {
      console.log('Dashboard Sidebar - Session:', session);
      console.log('Dashboard Sidebar - User Role:', session?.user?.role);
    }
  }, [session, mounted, loading]);
  
  // Use consistent default for SSR, then actual logo after hydration
  const logoUrl = !mounted ? "/logo.svg" : (siteSettings?.logo_url || "/logo.svg");
  
  // Build navigation items with Admin Panel for admins/managers
  const navMainItems = React.useMemo(() => {
    const items = [...data.navMain];
    const userRole = session?.user?.role;
    if (userRole && ["ADMIN", "MANAGER"].includes(userRole)) {
      items.push({
        title: "Admin Panel",
        url: "/admin",
        icon: IconShield,
      });
    }
    return items;
  }, [session?.user?.role]);
  
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full">
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5 flex-1"
              >
                <Link href="/">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-8 w-8 shrink-0 object-contain"
                  />
                </Link>
              </SidebarMenuButton>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
