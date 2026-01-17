"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavAdmin({
  items,
}: {
  items: {
    title: string;
    icon?: LucideIcon;
    items?: {
      title: string;
      url: string;
      icon?: LucideIcon;
    }[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70 px-2 py-2">
        Admin Controls
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton 
                  tooltip={item.title}
                  className="hover:bg-sidebar-accent/70 transition-all duration-200"
                >
                  {item.icon && <item.icon className="h-5 w-5 text-sidebar-foreground/70" />}
                  <span className="font-medium">{item.title}</span>
                  <ChevronRight className="ml-auto h-4 w-4 text-sidebar-foreground/50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="ml-2 border-l-2 border-sidebar-border pl-3 space-y-1">
                  {item.items?.map((subItem) => {
                    const isActive = pathname === subItem.url;
                    return (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton 
                          asChild
                          className={cn(
                            "hover:bg-sidebar-accent/70 transition-all duration-200",
                            isActive && "bg-sidebar-accent font-medium"
                          )}
                        >
                          <Link
                            href={subItem.url}
                            className="gap-2"
                          >
                            {subItem.icon && (
                              <subItem.icon 
                                className={cn(
                                  "w-4 h-4",
                                  isActive ? "text-primary" : "text-sidebar-foreground/70"
                                )}
                              />
                            )}
                            <span className={cn(isActive && "font-medium")}>
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
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
