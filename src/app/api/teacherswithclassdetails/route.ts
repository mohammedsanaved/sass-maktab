import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { z } from 'zod';
import { ApiError, handleApiError } from '@/lib/server/api-utils';
import { parseBody, parseQuery } from '@/lib/server/validation';

const teachersWithDetailsQuerySchema = z.object({
  search: z.string().optional(),
  classId: z.string().optional(),
  timeSlotId: z.string().optional(),
});

const updateTeacherAssignmentsSchema = z.object({
  teacherId: z.string().min(1),
  classId: z.string().min(1),
  timeSlotIds: z.array(z.string().min(1)),
  sectionName: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { search, classId, timeSlotId } = parseQuery(
      request,
      teachersWithDetailsQuerySchema
    );

    const where: Parameters<typeof prisma.teacher.findMany>[0]['where'] = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (classId || timeSlotId) {
      where.classSessions = {
        some: {
          ...(classId && { classLevelId: classId }),
          ...(timeSlotId && { timeSlotId: timeSlotId }),
        },
      };
    }

    const teachers = await prisma.teacher.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        classSessions: {
          include: {
            classLevel: true,
            timeSlot: true,
            _count: {
              select: { students: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data to group by Class
    const formattedTeachers = teachers.map((teacher) => {
      // Group sessions by classLevelId
      const classMap = new Map();

      teacher.classSessions.forEach((session) => {
        const classId = session.classLevelId;
        if (!classMap.has(classId)) {
          classMap.set(classId, {
            classLevel: session.classLevel,
            timeSlots: [],
            totalStudents: 0,
            sessions: [], // Keep track of session IDs/details if needed
          });
        }
        const entry = classMap.get(classId);
        entry.timeSlots.push(session.timeSlot);
        entry.totalStudents += session._count.students;
        entry.sessions.push({
            id: session.id,
            sectionName: session.sectionName,
            timeSlot: session.timeSlot
        });
      });

      return {
        ...teacher,
        classes: Array.from(classMap.values()),
      };
    });

    return NextResponse.json(formattedTeachers);
  } catch (error) {
    return handleApiError(error, 'Error fetching teachers');
  }
}

export async function PUT(request: Request) {
  try {
    const { teacherId, classId, timeSlotIds, sectionName } = await parseBody(
      request,
      updateTeacherAssignmentsSchema
    );

    // 1. Validation: Check if this Class is assigned to ANY OTHER teacher at the SAME TIME
    // (A Class cannot be taught by two teachers simultaneously)
    
    // We only care about the slots we are trying to ADD
    // Determine what to add (logic moved up for validation)
    const existingSessionsPre = await prisma.classSession.findMany({
        where: {
          teacherId,
          classLevelId: classId,
        },
      });
      const existingTimeSlotIdsPre = existingSessionsPre.map((s) => s.timeSlotId);
      const toAddPre = timeSlotIds.filter((id: string) => !existingTimeSlotIdsPre.includes(id));
      
    if (toAddPre.length > 0) {
        const conflictingSessions = await prisma.classSession.findFirst({
            where: {
                classLevelId: classId,
                timeSlotId: { in: toAddPre },
                teacherId: { not: teacherId } // Conflict if SOMEONE ELSE is teaching this class at these times
            },
            include: { teacher: true, timeSlot: true }
        });

        if (conflictingSessions) {
            throw new ApiError(
              409,
              `Class is already assigned to ${conflictingSessions.teacher.name} at ${conflictingSessions.timeSlot.startTime}.`
            );
        }
    }

    // 2. Transaction to update slots
    const result = await prisma.$transaction(async (tx) => {
      // Get existing sessions for this Teacher + Class
      const existingSessions = await tx.classSession.findMany({
        where: {
          teacherId,
          classLevelId: classId,
        },
      });
      
      const existingTimeSlotIds = existingSessions.map((s) => s.timeSlotId);
      
      // Determine what to add and what to remove
      const toAdd = timeSlotIds.filter((id) => !existingTimeSlotIds.includes(id));
      const toRemove = existingTimeSlotIds.filter((id) => !timeSlotIds.includes(id));

      // Remove
      if (toRemove.length > 0) {
        await tx.classSession.deleteMany({
            where: {
                teacherId,
                classLevelId: classId,
                timeSlotId: { in: toRemove }
            }
        });
      }

      // Add
      if (toAdd.length > 0) {
          // Check for conflicts (Teacher cannot be two places at once)
          // We rely on the composite unique index @@unique([teacherId, timeSlotId]) to throw error if conflict?
          // But that index is globally "teacherId + timeSlotId". 
          // So if teacher is teaching ClassB at TimeX, they cannot teach ClassA at TimeX.
          // This matches requirement.
          
          await tx.classSession.createMany({
              data: toAdd.map((tsId) => ({
                  teacherId,
                  classLevelId: classId,
                  timeSlotId: tsId,
                  sectionName: sectionName || undefined // Optional section name
              }))
          });
      }

      return { added: toAdd.length, removed: toRemove.length };
    });

    return NextResponse.json({ message: 'Assignments updated successfully', changes: result });

  } catch (error) {
    return handleApiError(error, 'Error assigning class');
  }
}
