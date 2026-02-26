import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { handleApiError } from '@/lib/server/api-utils';

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
    return handleApiError(error, 'Error fetching class sessions');
  }
}
