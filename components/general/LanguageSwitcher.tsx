"use client";

import { useState, useTransition, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸", dir: "ltr" },
  { code: "ar", name: "العربية", flag: "🇸🇦", dir: "rtl" },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentLocale, setCurrentLocale] = useState("en");

  useEffect(() => {
    // Get current locale from HTML attribute
    setCurrentLocale(document.documentElement.lang || "en");
  }, []);

  const switchLanguage = async (locale: string) => {
    const selectedLang = languages.find((l) => l.code === locale);
    
    startTransition(async () => {
      // Set cookie
      await fetch("/api/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });

      // Update HTML lang and dir attributes
      if (selectedLang) {
        document.documentElement.lang = locale;
        document.documentElement.dir = selectedLang.dir;
        setCurrentLocale(locale);
      }

      // Refresh the page to apply translations
      router.refresh();
    });
  };

  const currentLang = languages.find((l) => l.code === currentLocale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          tooltip="Change Language"
          className="h-9 w-9 p-0 hover:bg-sidebar-accent/70 transition-all duration-200"
          disabled={isPending}
        >
          <Globe className="h-5 w-5 text-sidebar-foreground/70 hover:text-primary transition-colors" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => switchLanguage(language.code)}
            className="flex items-center gap-3 cursor-pointer py-2.5"
          >
            <span className="text-xl">{language.flag}</span>
            <span className="font-medium">{language.name}</span>
            {currentLocale === language.code && (
              <span className="ml-auto text-primary font-bold">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
