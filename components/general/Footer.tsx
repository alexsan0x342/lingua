"use client";

import Link from "next/link";
import { useTranslations } from "./I18nProvider";

export function Footer() {
  const t = useTranslations();
  
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center space-y-2 text-sm text-muted-foreground">
          <p className="text-center">
            {t("common.madeForYouBy")}{" "}
            <Link 
              href="https://www.instagram.com/abdulhaq_benyousef" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline transition-colors"
            >
              abdulhaq
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
