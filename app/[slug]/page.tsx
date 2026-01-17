import { notFound } from "next/navigation";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { prisma } from "@/lib/db";
import { Navbar } from "@/app/(public)/_components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Footer } from "@/components/general/Footer";

type Params = Promise<{ slug: string }>;

export default async function PublicPage({ params }: { params: Params }) {
  const { slug } = await params;

  try {
    // Fetch directly from database instead of API call
    const page = await prisma.page.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!page || page.status !== "Published") {
      return notFound();
    }

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 flex-1">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            {/* Page Header */}
            <Card className="border-none shadow-sm">
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Page
                  </Badge>
                  {page.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      Published {new Date(page.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                  {page.title}
                </CardTitle>
                
                {page.author?.name && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>By {page.author.name}</span>
                  </div>
                )}
              </CardHeader>
            </Card>

            <Separator />

            {/* Page Content */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-4 md:p-8">
                <div className="prose prose-sm md:prose-lg dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-blockquote:text-muted-foreground prose-code:text-foreground prose-pre:bg-muted prose-a:text-primary hover:prose-a:text-primary/80">
                  <RenderDescription json={JSON.parse(page.content)} />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  } catch (error) {
    console.error("Error loading page:", error);
    return notFound();
  }
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;

  try {
    const pageData = await prisma.page.findUnique({
      where: { slug },
    });
    
    if (!pageData || pageData.status !== "Published") {
      return {
        title: "Page Not Found",
      };
    }

    return {
      title: pageData.title,
      description: pageData.metaDescription || `Read ${pageData.title}`,
    };
  } catch (error) {
    return {
      title: "Page Not Found",
    };
  }
}
