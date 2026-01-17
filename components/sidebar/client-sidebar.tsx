"use client";

import * as React from "react";
import { AppSidebar } from "./app-sidebar";
import { useLocale } from "@/components/general/I18nProvider";

export function ClientSidebar({ ...props }: React.ComponentProps<typeof AppSidebar>) {
  const [mounted, setMounted] = React.useState(false);
  const locale = useLocale();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything on the server to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  // Set sidebar side based on locale (RTL for Arabic)
  const side = locale === "ar" ? "right" : "left";

  return <AppSidebar side={side} {...props} />;
}


