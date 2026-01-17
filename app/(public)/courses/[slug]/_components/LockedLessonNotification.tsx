"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Lock } from "lucide-react";

interface LockedLessonNotificationProps {
  lockedMessage: string;
  lockedTitle: string;
}

export function LockedLessonNotification({ lockedMessage, lockedTitle }: LockedLessonNotificationProps) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (searchParams.get("locked") === "true") {
      toast.error(lockedMessage, {
        duration: 7000,
        description: lockedTitle,
        icon: <Lock className="size-5" />,
        classNames: {
          toast: "text-base p-4",
          title: "text-lg font-semibold",
          description: "text-base font-medium mt-1",
        },
      });
    }
  }, [searchParams, lockedMessage, lockedTitle]);
  
  return null;
}
