import { requireAdminOnly } from "@/app/data/admin/require-admin";
import Link from "next/link";

export default async function AdminBrandingPage() {
  await requireAdminOnly();
  
  return (
    <div className="container max-w-2xl mx-auto p-6">
      <div className="text-center space-y-6 py-16">
        <div className="text-6xl">⚙️</div>
        <h1 className="text-3xl font-bold">Branding Configured via Environment Variables</h1>
        <p className="text-muted-foreground text-lg">
          Branding settings are now managed through environment variables for better security and deployment practices.
        </p>
        <div className="bg-muted p-6 rounded-lg text-left space-y-3">
          <h3 className="font-semibold">Configuration:</h3>
          <p className="text-sm font-mono">SITE_BROWSER_NAME=Your Site Name</p>
          <p className="text-sm font-mono">LOGO=/logo.svg</p>
          <p className="text-sm text-muted-foreground mt-4">
            Place your logo file in the <code className="bg-background px-2 py-1 rounded">public/</code> directory and update the .env file.
          </p>
        </div>
        <Link 
          href="/admin" 
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90"
        >
          Return to Admin Dashboard
        </Link>
      </div>
    </div>
  );
}
