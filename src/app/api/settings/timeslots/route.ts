import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '../../../../lib/prisma';
import { handleApiError } from '@/lib/server/api-utils';
import { parseBody } from '@/lib/server/validation';

const createTimeSlotSchema = z.object({
  label: z.string().trim().min(1),
  startTime: z.string().trim().min(1),
  endTime: z.string().trim().min(1),
});

export async function GET() {
  try {
    const timeSlots = await prisma.timeSlot.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(timeSlots);
  } catch (error) {
    return handleApiError(error, 'Error fetching time slots');
  }
}

export async function POST(request: Request) {
  try {
    const { label, startTime, endTime } = await parseBody(
      request,
      createTimeSlotSchema
    );

    const newTimeSlot = await prisma.timeSlot.create({
      data: { label, startTime, endTime },
    });
    return NextResponse.json(newTimeSlot, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Error creating time slot');
  }
}
