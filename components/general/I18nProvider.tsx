"use client";

import { createContext, useContext, ReactNode, useEffect, useState } from "react";

type Messages = Record<string, any>;

interface I18nContextType {
  locale: string;
  messages: Messages;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({
  children,
  initialLocale,
  initialMessages,
}: {
  children: ReactNode;
  initialLocale: string;
  initialMessages: Messages;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const [messages, setMessages] = useState(initialMessages);

  // Update locale and messages when they change
  useEffect(() => {
    setLocale(initialLocale);
    setMessages(initialMessages);
    
    // Set HTML attributes
    document.documentElement.lang = initialLocale;
    document.documentElement.dir = initialLocale === "ar" ? "rtl" : "ltr";
  }, [initialLocale, initialMessages]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let value: any = messages;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    if (typeof value !== "string") {
      return key;
    }

    // Replace params in the string
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return paramKey in params ? String(params[paramKey]) : match;
      });
    }

    return value;
  };

  return (
    <I18nContext.Provider value={{ locale, messages, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(I18nContext);
  if (!context) {
    // Return a fallback function that returns the key's last part
    return (key: string) => key.split('.').pop() || key;
  }
  return context.t;
}

export function useLocale() {
  const context = useContext(I18nContext);
  if (!context) {
    // Return default locale when not in provider
    return 'en';
  }
  return context.locale;
}
