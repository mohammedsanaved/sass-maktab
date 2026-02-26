import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { z } from 'zod';
import { handleApiError } from '@/lib/server/api-utils';
import { parseQuery } from '@/lib/server/validation';

const migrationEnrollmentQuerySchema = z.object({
  academicYear: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { academicYear } = parseQuery(request, migrationEnrollmentQuerySchema);
    // 1. Fetch all students who are assigned to a classSession but have no enrollments for the current year
    const students = await prisma.student.findMany({
      where: {
        classSessionId: { not: null },
        // enrollments: { none: {} } // Can be more specific if needed
      },
      include: {
        enrollments: true,
      }
    });

    const currentYear = academicYear ?? '2024-2025';
    const migratedStudents = [];
    const skippedStudents = [];

    for (const student of students) {
      // Check if already enrolled in this year
      const hasEnrollment = student.enrollments.some(e => e.academicYear === currentYear);
      
      if (!hasEnrollment && student.classSessionId) {
        await prisma.studentEnrollment.create({
          data: {
            studentId: student.id,
            classSessionId: student.classSessionId,
            academicYear: currentYear,
            isActive: true,
            resultStatus: 'PENDING',
          }
        });
        migratedStudents.push(student.id);
      } else {
        skippedStudents.push(student.id);
      }
    }

    return NextResponse.json({
      message: 'Migration completed',
      totalStudents: students.length,
      migratedCount: migratedStudents.length,
      skippedCount: skippedStudents.length,
      migratedIds: migratedStudents,
    });
  } catch (error) {
    return handleApiError(error, 'Migration error');
  }
}
