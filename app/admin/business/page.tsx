import { Suspense } from "react";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { adminGetEnrollmentStats } from "@/app/data/admin/admin-get-enrollment-stats";
import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive";
import { SectionCards } from "@/components/sidebar/section-cards";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAdmin();
  const enrollmentData = await adminGetEnrollmentStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive overview of your platform performance
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Platform Overview</h2>
        <SectionCards />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Enrollment Trends</h2>
        <ChartAreaInteractive data={enrollmentData} />
      </section>
    </div>
  );
}
