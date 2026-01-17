import { NextRequest, NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/site-settings";

export async function GET(request: NextRequest) {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch site settings" },
      { status: 500 },
    );
  }
}
