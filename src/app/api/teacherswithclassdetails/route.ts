import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
// import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const classId = searchParams.get('classId');
    const timeSlotId = searchParams.get('timeSlotId');

    const where: any = {};

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
      include: {
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
    console.log("-----------------------------teachersDetails", teachers);

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
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { teacherId, classId, timeSlotIds, sectionName } = body;
    console.log("-----------------------------body", body);

    if (!teacherId || !classId || !timeSlotIds || !Array.isArray(timeSlotIds)) {
      return NextResponse.json(
        { error: 'Invalid input. teacherId, classId, and timeSlotIds (array) are required.' },
        { status: 400 }
      );
    }

    // 1. Validation: Check if this Class is assigned to ANY OTHER teacher
    const existingOtherTeacher = await prisma.classSession.findFirst({
        where: {
            classLevelId: classId,
            teacherId: { not: teacherId }
        },
        include: { teacher: true }
    });

    if (existingOtherTeacher) {
        return NextResponse.json(
            { error: `This Class is already assigned to ${existingOtherTeacher.teacher.name}. Cannot assign to multiple teachers.` },
            { status: 409 }
        );
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
      console.log("-----------------------------existingSessions", existingSessions);

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
          console.log("-----------------------------toAdd", toAdd);
      }

      return { added: toAdd.length, removed: toRemove.length };
    });

    return NextResponse.json({ message: 'Assignments updated successfully', changes: result });

  } catch (error: any) {
    console.error('Error assigning class:', error);
    if (error.code === 'P2002') {
         return NextResponse.json({ error: 'Conflict detected. Teacher might already be booked for this slot.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update assignments' }, { status: 500 });
  }
}
