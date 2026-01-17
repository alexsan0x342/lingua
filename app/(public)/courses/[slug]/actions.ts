"use server";

import { requireUser } from "@/app/data/user/require-user";
// import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
// import { request } from "@arcjet/next";
import { redirect } from "next/navigation";

// Temporarily disable Arcjet
// const aj = arcjet.withRule(
//   fixedWindow({
//     mode: "LIVE",
//     window: "1m",
//     max: 5,
//   })
// );

// Stripe payments disabled - this action is no longer used since we show inline redemption
export async function enrollInCourseAction(
  courseId: string
): Promise<ApiResponse> {
  return {
    status: "error",
    message: "Please use the redemption code form on this page to get course access",
  };
}
