import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '../../../../lib/prisma';
import { ApiError, handleApiError } from '@/lib/server/api-utils';
import { parseBody } from '@/lib/server/validation';

const promoteStudentsSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1),
  classId: z.string().min(1),
  timeSlotId: z.string().min(1),
  academicYear: z.string().min(1),
});

export async function PUT(request: Request) {
  try {
    const { studentIds, classId, timeSlotId, academicYear } = await parseBody(
      request,
      promoteStudentsSchema
    );

    // 1. Find the target session
    const targetSession = await prisma.classSession.findFirst({
      where: { classLevelId: classId, timeSlotId: timeSlotId },
    });

    if (!targetSession) {
      throw new ApiError(
        404,
        'Target Class Session not found. Please ensure this class is assigned to a teacher in Teacher Settings for the selected time slot.'
      );
    }

    // 2. Process Promotions Transactionally
    // We need to fetch the students first to check their current active enrollment
    const studentsToPromote = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: {
        enrollments: {
          where: { isActive: true }
        }
      }
    });

    const transactionOps = [];
    const promotedStudentIds = [];
    const failedStudentIds = []; // For logging or response

    for (const student of studentsToPromote) {
      // Logic:
      // - Close current active enrollment (if any)
      // - Create new enrollment in target session
      // - Update Student legacy fields (optional but good for viewing in old UI parts)
      
      const currentEnrollment = student.enrollments[0]; // Should be only one active
      
      // Validation: Check if we are double promoting in same year? 
      // If student already has an enrollment for `academicYear`, skip? 
      // For now, let's assume the UI handles year selection well, or we enforce unique constraint.
      // But let's check if they ALREADY have an enrollment for the TARGET year (maybe they were already promoted).
      const exists = await prisma.studentEnrollment.findFirst({
         where: { studentId: student.id, academicYear: academicYear }
      });
      
      if (exists) {
          failedStudentIds.push({ id: student.id, reason: "Already enrolled in this academic year" });
          continue; 
      }

      if (currentEnrollment) {
        transactionOps.push(
          prisma.studentEnrollment.update({
            where: { id: currentEnrollment.id },
            data: { 
                isActive: false, 
                resultStatus: 'PASSED' // Assessing them as PASSED since they are being promoted
            }
          })
        );
      }

      // Create new enrollment
      transactionOps.push(
        prisma.studentEnrollment.create({
          data: {
            studentId: student.id,
            classSessionId: targetSession.id,
            academicYear: academicYear,
            resultStatus: 'PENDING',
            isActive: true
          }
        })
      );

      // Update Legacy Fields (for backward compatibility if needed)
      // We still update classSessionId on Student for easy fetch in legacy queries not yet migrated
      transactionOps.push(
        prisma.student.update({
          where: { id: student.id },
          data: {
            classSessionId: targetSession.id,
            status: 'OLD',
          }
        })
      );
      
      promotedStudentIds.push(student.id);
    }

    if (transactionOps.length > 0) {
        await prisma.$transaction(transactionOps);
    }

    return NextResponse.json({
      message: 'Students promoted successfully',
      count: promotedStudentIds.length,
      skipped: failedStudentIds,
      targetSession: targetSession.id
    });
  } catch (error) {
    return handleApiError(error, 'Error promoting students');
  }
}
