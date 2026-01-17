import { Ban, PlusCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "../ui/button";

interface iAppProps {
  title: string;
  description: string;
  buttonText: string;
  href: string;
}

export function EmptyState({
  buttonText,
  description,
  title,
  href,
}: iAppProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50 min-h-[400px]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Ban className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mb-6 mt-2 text-sm text-muted-foreground max-w-sm">
        {description}
      </p>
      <Link href={href} className={buttonVariants()}>
        <PlusCircle className="mr-2 h-4 w-4" />
        {buttonText}
      </Link>
    </div>
  );
}
