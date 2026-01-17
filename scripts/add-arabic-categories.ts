import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

// Common category translations
const categoryTranslations: Record<string, string> = {
  "Teaching & Academics": "التدريس والأكاديميات",
  "Business": "الأعمال",
  "Development": "التطوير",
  "Design": "التصميم",
  "Marketing": "التسويق",
  "IT & Software": "تكنولوجيا المعلومات والبرمجيات",
  "Personal Development": "التطوير الشخصي",
  "Lifestyle": "أسلوب الحياة",
  "Photography": "التصوير الفوتوغرافي",
  "Health & Fitness": "الصحة واللياقة",
  "Music": "الموسيقى",
  "Office Productivity": "إنتاجية المكتب",
  "Finance & Accounting": "المالية والمحاسبة",
  "Programming": "البرمجة",
  "Mathematics": "الرياضيات",
  "Science": "العلوم",
  "Language": "اللغة",
  "Art": "الفن",
  "Technology": "التكنولوجيا",
  "Web Development": "تطوير الويب",
  "Mobile Development": "تطوير التطبيقات",
  "Data Science": "علم البيانات",
  "Machine Learning": "التعلم الآلي",
  "Artificial Intelligence": "الذكاء الاصطناعي",
};

async function addArabicToCategories() {
  try {
    console.log("🔄 Finding unique course categories and creating CourseCategory records...\n");

    // Get all unique categories from courses
    const courses = await prisma.course.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    console.log(`Found ${courses.length} unique categories\n`);

    for (const course of courses) {
      const categoryName = course.category;
      const arabicName = categoryTranslations[categoryName] || null;

      // Check if CourseCategory exists
      const existingCategory = await prisma.courseCategory.findFirst({
        where: { name: categoryName },
      });

      if (existingCategory) {
        // Update with Arabic name
        await prisma.courseCategory.update({
          where: { id: existingCategory.id },
          data: { nameAr: arabicName },
        });
        console.log(`✅ Updated "${categoryName}" → "${arabicName || 'No translation'}"`);
      } else {
        // Create new CourseCategory with Arabic name
        await prisma.courseCategory.create({
          data: {
            name: categoryName,
            nameAr: arabicName,
            slug: categoryName.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
          },
        });
        console.log(`✅ Created "${categoryName}" → "${arabicName || 'No translation'}"`);
      }
    }

    console.log("\n✨ Category update complete!");
  } catch (error) {
    console.error("❌ Error updating categories:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addArabicToCategories();
