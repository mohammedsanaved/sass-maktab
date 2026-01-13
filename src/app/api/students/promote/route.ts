import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { studentIds, classId, timeSlotId, academicYear } = body;

    if (!studentIds || !Array.isArray(studentIds) || !classId || !timeSlotId || !academicYear) {
      return NextResponse.json({ error: 'Invalid input. Missing required fields.' }, { status: 400 });
    }

    // 1. Find the target session
    const targetSession = await prisma.classSession.findFirst({
      where: { classLevelId: classId, timeSlotId: timeSlotId },
    });

    if (!targetSession) {
      return NextResponse.json(
        {
          error:
            'Target Class Session not found. Please ensure this class is assigned to a teacher in Teacher Settings for the selected time slot.',
        },
        { status: 404 }
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
    console.error('Error promoting students:', error);
    return NextResponse.json(
      { error: 'Failed to promote students' },
      { status: 500 }
    );
  }
}
