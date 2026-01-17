"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ContentManagementPage() {
  return (
    <div className="container max-w-2xl mx-auto p-6">
      <div className="text-center space-y-6 py-16">
        <div className="text-6xl">📝</div>
        <h1 className="text-3xl font-bold">Page Maker Disabled</h1>
        <p className="text-muted-foreground text-lg">
          The page maker feature has been disabled. Use the admin panel to manage courses, users, and content directly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button asChild>
            <Link href="/admin/courses">
              Manage Courses
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">
              Admin Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
