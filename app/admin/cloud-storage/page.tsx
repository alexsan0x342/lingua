import { requireAdmin } from "@/app/data/admin/require-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Cloud, Settings, CheckCircle, XCircle, AlertCircle, Upload, Database } from "lucide-react";

export default async function CloudStoragePage() {
  await requireAdmin();

  const isConfigured = false; // Supabase storage removed

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Cloud className="h-8 w-8" />
          Cloud Storage
        </h1>
        <p className="text-muted-foreground mt-2">
          Cloud storage functionality has been removed from this application
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration Status
            </CardTitle>
            <CardDescription>
              Current cloud storage configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cloud Storage</span>
              <Badge variant={isConfigured ? "default" : "destructive"}>
                {isConfigured ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configured
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Configured
                  </>
                )}
              </Badge>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Supabase URL</span>
                <Badge variant={process.env.SUPABASE_URL ? "default" : "secondary"}>
                  {process.env.SUPABASE_URL ? "Set" : "Not Set"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Supabase Anon Key</span>
                <Badge variant={process.env.SUPABASE_ANON_KEY ? "default" : "secondary"}>
                  {process.env.SUPABASE_ANON_KEY ? "Set" : "Not Set"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage Bucket</span>
                <Badge variant={process.env.SUPABASE_BUCKET_NAME ? "default" : "secondary"}>
                  {process.env.SUPABASE_BUCKET_NAME ? process.env.SUPABASE_BUCKET_NAME : "Not Set"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">S3 Endpoint</span>
                <Badge variant={process.env.AWS_ENDPOINT_URL_S3 ? "default" : "secondary"}>
                  {process.env.AWS_ENDPOINT_URL_S3 ? "Set" : "Not Set"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Region</span>
                <Badge variant={process.env.AWS_REGION ? "default" : "secondary"}>
                  {process.env.AWS_REGION || "auto"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Storage Features
            </CardTitle>
            <CardDescription>
              What cloud storage provides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Automatic Upload</h4>
                  <p className="text-sm text-muted-foreground">
                    All files automatically uploaded to cloud storage
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Vercel Ready</h4>
                  <p className="text-sm text-muted-foreground">
                    Perfect for serverless deployment on Vercel
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Fallback Support</h4>
                  <p className="text-sm text-muted-foreground">
                    Falls back to local storage if cloud fails
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">CDN Support</h4>
                  <p className="text-sm text-muted-foreground">
                    Optional CloudFront CDN for faster delivery
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Organized Storage</h4>
                  <p className="text-sm text-muted-foreground">
                    Files organized by type and user
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Setup Instructions
          </CardTitle>
          <CardDescription>
            How to configure Supabase storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">1. Create Supabase Account</h4>
              <p className="text-sm text-blue-800">
                Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">Supabase.com</a> and create an account if you don't have one.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">2. Create Project & Storage Bucket</h4>
              <p className="text-sm text-green-800">
                In your Supabase dashboard, create a new project and enable Storage with a public bucket.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">3. Get API Credentials</h4>
              <p className="text-sm text-purple-800">
                In your project settings, copy your Project URL and anon/public key.
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-2">4. Configure Environment Variables</h4>
              <p className="text-sm text-orange-800">
                Add these variables to your <code className="bg-orange-100 px-1 rounded">.env.local</code> file:
              </p>
              <pre className="mt-2 p-2 bg-orange-100 rounded text-xs overflow-x-auto">
{`SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_BUCKET_NAME=your_bucket_name_here`}
              </pre>
            </div>
            
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-indigo-900 mb-2">5. Test Configuration</h4>
              <p className="text-sm text-indigo-800">
                Upload a test file through the admin interface to verify your configuration is working.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Types Supported */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Supported File Types</CardTitle>
          <CardDescription>
            File types that can be uploaded to cloud storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h4 className="font-medium mb-2">Images</h4>
              <p className="text-sm text-muted-foreground">
                JPG, PNG, GIF, WebP, SVG
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Documents</h4>
              <p className="text-sm text-muted-foreground">
                PDF, DOC, DOCX, TXT, MD, RTF
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Videos</h4>
              <p className="text-sm text-muted-foreground">
                MP4, AVI, MOV, WMV, FLV, WebM
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Archives</h4>
              <p className="text-sm text-muted-foreground">
                ZIP, RAR, 7Z
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Benefits of Cloud Storage</CardTitle>
          <CardDescription>
            Why cloud storage is important for your LMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Upload className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Vercel Deployment</h4>
                <p className="text-sm text-muted-foreground">
                  Serverless functions can't store files locally, cloud storage is essential
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Scalability</h4>
                <p className="text-sm text-muted-foreground">
                  Handle unlimited file uploads without server storage limits
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Reliability</h4>
                <p className="text-sm text-muted-foreground">
                  AWS S3 provides 99.999999999% durability for your files
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Cloud className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Global Access</h4>
                <p className="text-sm text-muted-foreground">
                  Files accessible from anywhere with fast global delivery
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
