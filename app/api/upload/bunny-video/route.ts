import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY;
const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;

// POST /api/upload/bunny-video - Create video entry and get upload credentials
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!BUNNY_STREAM_API_KEY || !BUNNY_STREAM_LIBRARY_ID) {
      console.error("Bunny Stream not configured");
      return NextResponse.json(
        { error: "Video service not configured" },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { title, lessonId, courseId } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Video title is required" },
        { status: 400 },
      );
    }

    // Create video entry in Bunny.net Stream
    const createResponse = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos`,
      {
        method: "POST",
        headers: {
          AccessKey: BUNNY_STREAM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          // Optional metadata
          ...(lessonId && {
            metaTags: [{ property: "lessonId", value: lessonId }],
          }),
          ...(courseId && {
            metaTags: [{ property: "courseId", value: courseId }],
          }),
        }),
      },
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("Bunny create video error:", errorText);
      throw new Error(
        `Failed to create video entry: ${createResponse.statusText}`,
      );
    }

    const videoData = await createResponse.json();

    console.log("Video entry created:", videoData.guid);

    return NextResponse.json({
      success: true,
      videoId: videoData.guid,
      uploadUrl: `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoData.guid}`,
      apiKey: BUNNY_STREAM_API_KEY, // Access key for direct upload
      authorizationSignature: BUNNY_STREAM_API_KEY, // For TUS upload (legacy)
      authorizationExpire: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      libraryId: BUNNY_STREAM_LIBRARY_ID,
    });
  } catch (error) {
    console.error("Error creating video entry:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create video entry",
      },
      { status: 500 },
    );
  }
}
