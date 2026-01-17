import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { Footer } from "@/components/general/Footer";
import { SimpleLanguageSwitcher } from "@/components/general/SimpleLanguageSwitcher";
import { cookies } from "next/headers";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const messages = (await import(`@/messages/${locale}.json`)).default;

  const t = (key: string) => {
    const keys = key.split(".");
    let value: any = messages;
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    return typeof value === "string" ? value : key;
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center p-4">


    

      <div className="flex w-full max-w-sm flex-col gap-6 px-4">
       
        {children}

        <div className="text-balance text-center text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
          {t("auth.agreeToTerms")}{" "}
          <span className="hover:text-primary hover:underline">
            {t("auth.termsOfService")}
          </span>{" "}
          {t("auth.and")}{" "}
          <span className="hover:text-primary hover:underline">
            {t("auth.privacyPolicy")}
          </span>
          .
        </div>
      </div>
      <Footer />
    </div>
  );
}
