import prisma from '@/lib/prisma';

export async function fetchStudentsForExport() {
  return prisma.student.findMany({
    include: {
      classSession: {
        include: {
          classLevel: true,
          timeSlot: true,
        },
      },
    },
    orderBy: { studentName: 'asc' },
  });
}
