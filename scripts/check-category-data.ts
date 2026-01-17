import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

async function checkCategoryData() {
  try {
    console.log("🔍 Checking CourseCategory data...\n");

    const categories = await prisma.courseCategory.findMany();
    console.log("Categories:", JSON.stringify(categories, null, 2));

    console.log("\n🔍 Checking Course data with categories...\n");

    const courses = await prisma.course.findMany({
      where: { status: "Published" },
      select: {
        id: true,
        title: true,
        category: true,
        categoryId: true,
        courseCategory: {
          select: {
            name: true,
            nameAr: true,
          },
        },
      },
    });

    console.log("Courses:", JSON.stringify(courses, null, 2));
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategoryData();
