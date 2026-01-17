import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_STORAGE_ZONE_NAME =
  process.env.BUNNY_STORAGE_ZONE_NAME || "lingua-ly";
const BUNNY_STORAGE_HOSTNAME =
  process.env.BUNNY_STORAGE_HOSTNAME || "storage.bunnycdn.com";

// DELETE /api/upload/bunny-image/[...path] - Delete image from Bunny.net Storage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path } = await params;
    const filePath = path.join("/");

    if (!filePath) {
      return NextResponse.json(
        { error: "No file path provided" },
        { status: 400 },
      );
    }

    if (!BUNNY_STORAGE_API_KEY) {
      console.error("BUNNY_STORAGE_API_KEY not configured");
      return NextResponse.json(
        { error: "Storage service not configured" },
        { status: 500 },
      );
    }

    // Delete from Bunny.net Storage
    const deleteUrl = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE_NAME}/${filePath}`;

    const deleteResponse = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        AccessKey: BUNNY_STORAGE_API_KEY,
      },
    });

    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      const errorText = await deleteResponse.text();
      console.error("Bunny delete error:", errorText);
      throw new Error(
        `Failed to delete from Bunny.net: ${deleteResponse.statusText}`,
      );
    }

    console.log("Image deleted successfully:", filePath);

    return NextResponse.json({
      success: true,
      deleted: filePath,
    });
  } catch (error) {
    console.error("Error deleting image from Bunny:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete image",
      },
      { status: 500 },
    );
  }
}
