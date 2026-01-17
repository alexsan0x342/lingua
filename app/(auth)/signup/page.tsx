import { SignupForm } from "./_components/SignupForm";
import { cookies } from "next/headers";

export default async function SignupPage() {
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
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 text-center items-center justify-center">
        <h1 className="text-2xl font-semibold">{t("auth.createAccount")}</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          {t("auth.enterInformation")}
        </p>
      </div>
      <SignupForm />
    </div>
  );
}