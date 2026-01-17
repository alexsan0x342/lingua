import { prisma } from "@/lib/db";

export async function getAllCategories() {
  try {
    const categories = await prisma.courseCategory.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        slug: true,
      }
    });
    
    return categories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}
