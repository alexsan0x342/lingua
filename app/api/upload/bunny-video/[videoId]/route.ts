import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY;
const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;

// DELETE /api/upload/bunny-video/[videoId] - Delete video from Bunny.net Stream
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId } = await params;

    if (!videoId) {
      return NextResponse.json(
        { error: "No video ID provided" },
        { status: 400 },
      );
    }

    if (!BUNNY_STREAM_API_KEY || !BUNNY_STREAM_LIBRARY_ID) {
      console.error("Bunny Stream not configured");
      return NextResponse.json(
        { error: "Video service not configured" },
        { status: 500 },
      );
    }

    // Delete from Bunny.net Stream
    const deleteUrl = `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`;

    const deleteResponse = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        AccessKey: BUNNY_STREAM_API_KEY,
      },
    });

    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      const errorText = await deleteResponse.text();
      console.error("Bunny video delete error:", errorText);
      throw new Error(
        `Failed to delete video from Bunny.net: ${deleteResponse.statusText}`,
      );
    }

    console.log("Video deleted successfully:", videoId);

    return NextResponse.json({
      success: true,
      deleted: videoId,
    });
  } catch (error) {
    console.error("Error deleting video from Bunny:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete video",
      },
      { status: 500 },
    );
  }
}
