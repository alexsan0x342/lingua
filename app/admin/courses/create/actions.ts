"use server";

// NOTE: Stripe integration temporarily disabled for showcase mode
// Courses are created with dummy Stripe price IDs for demo purposes
// To re-enable: uncomment Stripe product creation code below

import { requireAdmin } from "@/app/data/admin/require-admin";
// import arcjet, { fixedWindow } from "@/lib/arcjet";

import { prisma } from "@/lib/db";
// import { stripe } from "@/lib/stripe"; // Commented out for showcase mode
import { ApiResponse } from "@/lib/types";
import { courseSchema, CourseSchemaType } from "@/lib/zodSchemas";
// import { request } from "@arcjet/next";

// Temporarily disable Arcjet
// const aj = arcjet.withRule(
//   fixedWindow({
//     mode: "LIVE",
//     window: "1m",
//     max: 5,
//   })
// );

export async function CreateCourse(
  values: CourseSchemaType
): Promise<ApiResponse> {
  console.log('🚀 CreateCourse called with values:', values);
  
  let session;
  try {
    session = await requireAdmin();
    console.log('✅ Admin session verified:', session.user.email);
  } catch (sessionError) {
    console.error('❌ Admin session verification failed:', sessionError);
    return {
      status: "error",
      message: "Authentication failed. Please log in as admin.",
    };
  }

  try {
    // Arcjet protection temporarily disabled
    // console.log('🔒 Running Arcjet protection...');
    // const req = await request();
    // const decision = await aj.protect(req, {
    //   fingerprint: session.user.id,
    // });
    // console.log('🔒 Arcjet decision:', decision.conclusion);

    // if (decision.isDenied()) {
    //   console.log('❌ Arcjet blocked request:', decision.reason);
    //   if (decision.reason.isRateLimit()) {
    //     return {
    //       status: "error",
    //       message: "You have been blocked due to rate limiting",
    //     };
    //   } else {
    //     return {
    //       status: "error",
    //       message: "You are a bot! if this is a mistake contact our support",
    //     };
    //   }
    // }

    console.log('✅ Validating form data...');
    const validation = courseSchema.safeParse(values);

    if (!validation.success) {
      console.error('❌ Form validation failed:', validation.error.errors);
      return {
        status: "error",
        message: `Invalid Form Data: ${validation.error.errors.map(e => e.message).join(', ')}`,
      };
    }

    console.log('✅ Form validation passed');
    console.log('💳 Skipping Stripe product creation (showcase mode)...');
    
    // Skip Stripe for showcase - use a dummy price ID
    const dummyStripePriceId = `price_showcase_${Date.now()}`;
    console.log('✅ Using dummy Stripe price ID:', dummyStripePriceId);

    // Find the category ID based on category name
    let categoryId = null;
    if (validation.data.category) {
      const category = await prisma.courseCategory.findFirst({
        where: {
          name: validation.data.category
        },
        select: {
          id: true
        }
      });
      categoryId = category?.id || null;
      console.log('📂 Category lookup:', validation.data.category, '→', categoryId);
    }

    console.log('💾 Creating course in database...');
    let course;
    try {
      course = await prisma.course.create({
        data: {
          ...validation.data,
          userId: session?.user.id as string,
          stripePriceId: dummyStripePriceId,
          categoryId: categoryId,
        },
      });
      console.log('✅ Course created successfully:', course.id);

      // Auto-enroll the course creator
      console.log('🎓 Auto-enrolling course creator...');
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: session.user.id,
          courseId: course.id,
          amount: 0, // Free for creator
          status: 'Active'
        },
      });
      console.log('✅ Course creator auto-enrolled:', enrollment.id);
    } catch (dbError) {
      console.error('❌ Database course creation failed:', dbError);
      
      // If course was created but enrollment failed, try to clean up
      if (course) {
        try {
          await prisma.course.delete({ where: { id: course.id } });
          console.log('🧹 Cleaned up orphaned course');
        } catch (cleanupError) {
          console.error('⚠️ Failed to clean up course:', cleanupError);
        }
      }
      
      return {
        status: "error",
        message: `Failed to save course: ${dbError instanceof Error ? dbError.message : 'Database error'}`,
      };
    }

    return {
      status: "success",
      message: "Course created successfully (showcase mode)",
    };
  } catch (generalError) {
    console.error('❌ General error in CreateCourse:', generalError);
    return {
      status: "error",
      message: `Failed to create course: ${generalError instanceof Error ? generalError.message : 'Unknown error'}`,
    };
  }
}

/* 
// STRIPE INTEGRATION CODE (commented out for showcase mode)
// To re-enable: uncomment the import above and replace the dummy price ID logic with this:

    console.log('💳 Creating Stripe product...');
    
    let stripeProduct;
    try {
      stripeProduct = await stripe.products.create({
        name: validation.data.title,
        description: validation.data.smallDescription,
        default_price_data: {
          currency: "usd",
          unit_amount: validation.data.price * 100,
        },
      });
      console.log('✅ Stripe product created:', stripeProduct.id);
    } catch (stripeError) {
      console.error('❌ Stripe product creation failed:', stripeError);
      return {
        status: "error",
        message: `Failed to create Stripe product: ${stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'}`,
      };
    }

    // Use stripeProduct.default_price as string instead of dummyStripePriceId
    
    // Add cleanup logic back in the database error catch block:
    try {
      await stripe.products.update(stripeProduct.id, { active: false });
      console.log('🧹 Deactivated orphaned Stripe product');
    } catch (cleanupError) {
      console.error('⚠️ Failed to clean up Stripe product:', cleanupError);
    }
*/
