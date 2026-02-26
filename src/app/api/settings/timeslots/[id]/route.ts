import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '../../../../../lib/prisma';
import { ApiError, handleApiError } from '@/lib/server/api-utils';
import { parseBody, parseParams } from '@/lib/server/validation';

const routeParamsSchema = z.object({
  id: z.string().min(1),
});

const updateTimeSlotSchema = z.object({
  label: z.string().trim().min(1),
  startTime: z.string().trim().min(1),
  endTime: z.string().trim().min(1),
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await parseParams(params, routeParamsSchema);
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id },
    });
    if (!timeSlot) {
      throw new ApiError(404, 'Time slot not found');
    }
    return NextResponse.json(timeSlot);
  } catch (error) {
    return handleApiError(error, 'Error fetching time slot');
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await parseParams(params, routeParamsSchema);
    const { label, startTime, endTime } = await parseBody(
      request,
      updateTimeSlotSchema
    );

    const updatedTimeSlot = await prisma.timeSlot.update({
      where: { id },
      data: { label, startTime, endTime },
    });
    return NextResponse.json(updatedTimeSlot);
  } catch (error) {
    return handleApiError(error, 'Error updating time slot');
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await parseParams(params, routeParamsSchema);
    await prisma.timeSlot.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Time slot deleted successfully' });
  } catch (error) {
    return handleApiError(error, 'Error deleting time slot');
  }
}
