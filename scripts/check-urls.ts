import { prisma } from '../lib/db';

async function checkUrls() {
  try {
    const courses = await prisma.course.findMany({
      where: {
        fileKey: {
          not: ''
        }
      },
      select: {
        id: true,
        title: true,
        fileKey: true
      },
      take: 10
    });

    console.log('Sample course fileKeys:');
    console.log(JSON.stringify(courses, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUrls();
