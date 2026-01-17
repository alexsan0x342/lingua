import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "../ui/themeToggle";
import { NotificationDropdown } from "../general/NotificationDropdown";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="relative ltr:-ml-1 rtl:-mr-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4"
        />
        <div className="ltr:ml-auto rtl:mr-auto flex items-center gap-2">
          <NotificationDropdown />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
