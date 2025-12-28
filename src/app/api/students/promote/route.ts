import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { studentIds, classId, timeSlotId } = body;

    if (!studentIds || !Array.isArray(studentIds) || !classId || !timeSlotId) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Find the session 
    const session = await prisma.classSession.findFirst({
        where: { classLevelId: classId, timeSlotId: timeSlotId }
    });

    if (!session) {
        return NextResponse.json({ error: 'Target Class Session not found' }, { status: 404 });
    }

    // Bulk update
    const result = await prisma.student.updateMany({
        where: { id: { in: studentIds } },
        data: {
            classSessionId: session.id
        }
    });

    return NextResponse.json({ message: 'Students promoted successfully', count: result.count });

  } catch (error) {
    console.error('Error promoting students:', error);
    return NextResponse.json({ error: 'Failed to promote students' }, { status: 500 });
  }
}
