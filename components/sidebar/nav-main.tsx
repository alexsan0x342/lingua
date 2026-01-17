"use client";

import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react";
import { ChevronRight } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();
  
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-1">
        {pathname.startsWith("/admin") && (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                asChild
                tooltip="Quick Create"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear shadow-sm hover:shadow-md transition-all"
              >
                <Link href="/admin/courses/create" className="gap-3">
                  <IconCirclePlusFilled className="h-5 w-5" />
                  <span className="font-medium">Quick Create</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url;
            const hasSubItems = item.items && item.items.length > 0;
            
            // If item has sub-items, render as collapsible
            if (hasSubItems) {
              return (
                <Collapsible key={item.title} asChild defaultOpen={pathname === item.url} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton 
                        tooltip={item.title}
                        className={cn(
                          "transition-all duration-200 hover:bg-sidebar-accent/70",
                          isActive && "bg-sidebar-accent font-medium shadow-sm"
                        )}
                      >
                        {item.icon && (
                          <item.icon
                            className={cn(
                              "h-5 w-5 transition-colors",
                              isActive ? "text-primary" : "text-sidebar-foreground/70"
                            )}
                          />
                        )}
                        <span className={cn(isActive && "font-medium")}>
                          {item.title}
                        </span>
                        <ChevronRight className="ml-auto h-4 w-4 text-sidebar-foreground/50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="ml-2 border-l-2 border-sidebar-border pl-3 mt-1 mb-2 space-y-1">
                        {item.items?.map((subItem) => {
                          const isSubItemActive = pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton 
                                asChild
                                className={cn(
                                  "hover:bg-sidebar-accent/70 transition-all duration-200 rounded-md",
                                  isSubItemActive && "bg-sidebar-accent font-medium"
                                )}
                              >
                                <Link href={subItem.url}>
                                  <span className={cn(isSubItemActive && "font-medium text-primary")}>
                                    {subItem.title}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }
            
            // Regular item without sub-items
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  tooltip={item.title} 
                  asChild
                  className={cn(
                    "transition-all duration-200 hover:bg-sidebar-accent/70",
                    isActive && "bg-sidebar-accent font-medium shadow-sm"
                  )}
                >
                  <Link
                    href={item.url}
                    className="gap-3 py-2"
                  >
                    {item.icon && (
                      <item.icon
                        className={cn(
                          "h-5 w-5 transition-colors",
                          isActive ? "text-primary" : "text-sidebar-foreground/70"
                        )}
                      />
                    )}
                    <span className={cn(isActive && "font-medium")}>
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
