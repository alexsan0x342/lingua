import { EmailManager } from "@/components/admin/EmailManager";
import { Mail } from "lucide-react";
import { requireAdminOnly } from "@/app/data/admin/require-admin";

export default async function AdminEmailsPage() {
  await requireAdminOnly(); // Only ADMIN role can access this page
  
  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Email Management</h1>
            <p className="text-muted-foreground text-lg mt-1">
              Send emails to users and manage email notifications
            </p>
          </div>
        </div>
      </div>
      
      <EmailManager />
    </div>
  );
}
