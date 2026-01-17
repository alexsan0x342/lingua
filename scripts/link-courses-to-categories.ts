import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

async function linkCoursesToCategories() {
  try {
    console.log("🔄 Linking courses to their CourseCategory records...\n");

    // Get all courses
    const courses = await prisma.course.findMany({
      select: { id: true, category: true, categoryId: true },
    });

    console.log(`Found ${courses.length} courses\n`);

    for (const course of courses) {
      if (course.categoryId) {
        console.log(`⏭️  Course already linked to category, skipping`);
        continue;
      }

      // Find the matching CourseCategory
      const courseCategory = await prisma.courseCategory.findFirst({
        where: { name: course.category },
      });

      if (courseCategory) {
        // Link the course to the category
        await prisma.course.update({
          where: { id: course.id },
          data: { categoryId: courseCategory.id },
        });
        console.log(`✅ Linked course to category "${course.category}"`);
      } else {
        console.log(`⚠️  No CourseCategory found for "${course.category}"`);
      }
    }

    console.log("\n✨ Course linking complete!");
  } catch (error) {
    console.error("❌ Error linking courses:", error);
  } finally {
    await prisma.$disconnect();
  }
}

linkCoursesToCategories();
