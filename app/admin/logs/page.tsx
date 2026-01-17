import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isSuperAdmin } from "@/lib/admin-logger";
import { redirect } from "next/navigation";
import { AdminLogsViewer } from "./_components/AdminLogsViewer";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Only super admin can access this page
  if (!isSuperAdmin(session.user.email)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mt-1">
            Only the super admin can view this page.
          </p>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p>You do not have permission to access admin logs.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Activity Logs</h1>
        <p className="text-muted-foreground mt-1">
          Monitor all admin actions across the platform
        </p>
      </div>

      <Suspense fallback={<LogsSkeleton />}>
        <AdminLogsViewer />
      </Suspense>
    </div>
  );
}

function LogsSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
