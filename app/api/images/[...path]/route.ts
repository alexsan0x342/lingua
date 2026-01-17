import { NextRequest, NextResponse } from "next/server";

const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_STORAGE_ZONE_NAME =
  process.env.BUNNY_STORAGE_ZONE_NAME || "lingua-ly";
const BUNNY_STORAGE_HOSTNAME =
  process.env.BUNNY_STORAGE_HOSTNAME || "storage.bunnycdn.com";

// GET /api/images/[...path] - Proxy images from Bunny Storage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const imagePath = path.join("/");

    if (!BUNNY_STORAGE_API_KEY) {
      return NextResponse.json(
        { error: "Storage service not configured" },
        { status: 500 },
      );
    }

    // Fetch from Bunny Storage
    const storageUrl = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE_NAME}/${imagePath}`;

    const response = await fetch(storageUrl, {
      headers: {
        AccessKey: BUNNY_STORAGE_API_KEY,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    return NextResponse.json(
      { error: "Failed to load image" },
      { status: 500 },
    );
  }
}
