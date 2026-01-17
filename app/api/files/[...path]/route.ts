import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getBunnyFileUrl, isValidFileKey } from "@/lib/file-storage";

// GET /api/files/[...path] - Proxy file download from Bunny.net
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path } = await params;
    const fileKey = path.join("/");

    if (!fileKey || !isValidFileKey(fileKey)) {
      return NextResponse.json({ error: "Invalid file key" }, { status: 400 });
    }

    // Get the Bunny.net URL for the file
    const fileUrl = getBunnyFileUrl(fileKey);

    // Fetch the file from Bunny.net
    const response = await fetch(fileUrl);

    if (!response.ok) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Get the file content
    const blob = await response.blob();

    // Extract filename from the fileKey
    const fileName = fileKey.split("/").pop() || "download";
    // Remove timestamp and random prefix if present (format: timestamp_random_filename)
    const cleanFileName = fileName.replace(/^\d+_[a-f0-9]+_/, "");

    // Return the file with proper headers
    return new NextResponse(blob, {
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${cleanFileName}"`,
        "Content-Length": blob.size.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 },
    );
  }
}
