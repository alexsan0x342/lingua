"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";

export function LanguageToggle() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentLocale, setCurrentLocale] = useState("en");

  useEffect(() => {
    setCurrentLocale(document.documentElement.lang || "en");
  }, []);

  const toggleLanguage = async () => {
    const newLocale = currentLocale === "en" ? "ar" : "en";
    const newDir = newLocale === "ar" ? "rtl" : "ltr";

    startTransition(async () => {
      // Set cookie
      await fetch("/api/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: newLocale }),
      });

      // Update HTML attributes
      document.documentElement.lang = newLocale;
      document.documentElement.dir = newDir;
      setCurrentLocale(newLocale);

      // Refresh the page
      router.refresh();
    });
  };

  return (
    <Button
      onClick={toggleLanguage}
      disabled={isPending}
      variant="outline"
      size="sm"
      className="w-full justify-start gap-2"
    >
      <Globe className="h-4 w-4" />
      <span>{currentLocale === "en" ? "العربية" : "English"}</span>
      <span className="ml-auto text-xs opacity-60">
        {currentLocale === "en" ? "🇸🇦" : "🇺🇸"}
      </span>
    </Button>
  );
}
