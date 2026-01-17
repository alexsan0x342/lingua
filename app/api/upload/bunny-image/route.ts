import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { env } from "@/lib/env";

const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_STORAGE_ZONE_NAME =
  process.env.BUNNY_STORAGE_ZONE_NAME || "lingua-ly";
const BUNNY_STORAGE_HOSTNAME =
  process.env.BUNNY_STORAGE_HOSTNAME || "storage.bunnycdn.com";

// POST /api/upload/bunny-image - Upload image to Bunny.net Storage
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!BUNNY_STORAGE_API_KEY) {
      console.error("BUNNY_STORAGE_API_KEY not configured");
      return NextResponse.json(
        { error: "Storage service not configured" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const uploadType = formData.get("uploadType") as string;
    const entityId = formData.get("entityId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 },
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 },
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop();
    const filename = `${uploadType || "image"}-${entityId || timestamp}-${randomString}.${extension}`;

    // Determine folder based on upload type
    const folder =
      uploadType === "course"
        ? "courses"
        : uploadType === "lesson"
          ? "lessons"
          : uploadType === "profile"
            ? "profiles"
            : "images";

    const path = `${folder}/${filename}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Bunny.net Storage
    const uploadUrl = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE_NAME}/${path}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: BUNNY_STORAGE_API_KEY,
        "Content-Type": file.type,
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Bunny upload error:", errorText);
      throw new Error(
        `Failed to upload to Bunny.net: ${uploadResponse.statusText}`,
      );
    }

    // Construct CDN URL - Use NEXT_PUBLIC_BUNNY_STORAGE_URL for consistency with client
    const cdnUrl =
      process.env.NEXT_PUBLIC_BUNNY_STORAGE_URL || "https://cdn.lingua-ly.com";
    const fileUrl = `${cdnUrl}/${path}`;

    console.log("Image uploaded successfully:", {
      path,
      fileUrl,
      cdnUrl,
    });

    return NextResponse.json({
      success: true,
      key: path,
      url: fileUrl,
      filename: filename,
    });
  } catch (error) {
    console.error("Error uploading image to Bunny:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload image",
      },
      { status: 500 },
    );
  }
}
