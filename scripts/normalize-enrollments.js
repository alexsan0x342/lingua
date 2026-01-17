const { PrismaClient } = require('../lib/generated/prisma');

(async () => {
  const prisma = new PrismaClient();
  try {
    const res = await prisma.enrollment.updateMany({
      where: { status: 'Active', amount: 0 },
      data: { status: 'Pending' }
    });
    console.log('Normalized enrollments count:', res.count);
  } catch (e) {
    console.error('Normalization failed:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();











