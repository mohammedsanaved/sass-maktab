import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET() {
  try {
    const sessions = await prisma.classSession.findMany({
      include: {
        classLevel: true,
        timeSlot: true,
        teacher: {
            select: { name: true }
        }
      },
      orderBy: [
        { classLevel: { name: 'asc' } },
        { timeSlot: { startTime: 'asc' } }
      ]
    });
    
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching class sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch class sessions' }, { status: 500 });
  }
}
