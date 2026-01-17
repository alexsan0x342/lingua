import { prisma } from '../lib/db';

async function createTestCode() {
  try {
    // Create a simple test code for course access
    const testCode = await prisma.redemptionCode.create({
      data: {
        code: 'TEST123',
        type: 'COURSE',
        value: 0,
        courseId: null, // Will grant access to any course
        maxUses: 10,
        isActive: true,
        serviceType: 'Test Course Access'
      }
    });

    console.log('Test code created:', testCode);
    
    // Also create a course-specific code if there are courses
    const firstCourse = await prisma.course.findFirst({
      select: { id: true, title: true }
    });

    if (firstCourse) {
      const courseCode = await prisma.redemptionCode.create({
        data: {
          code: 'COURSE123',
          type: 'COURSE',
          value: 0,
          courseId: firstCourse.id,
          maxUses: 5,
          isActive: true
        }
      });

      console.log('Course-specific code created:', courseCode);
      console.log('Course:', firstCourse);
    }

  } catch (error) {
    console.error('Error creating test codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestCode();