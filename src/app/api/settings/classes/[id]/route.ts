import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '../../../../../lib/prisma';
import { ApiError, handleApiError } from '@/lib/server/api-utils';
import { parseBody, parseParams } from '@/lib/server/validation';

const routeParamsSchema = z.object({
  id: z.string().min(1),
});

const updateClassSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await parseParams(params, routeParamsSchema);
    const classLevel = await prisma.classLevel.findUnique({
      where: { id },
    });
    if (!classLevel) {
      throw new ApiError(404, 'Class not found');
    }
    return NextResponse.json(classLevel);
  } catch (error) {
    return handleApiError(error, 'Error fetching class');
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await parseParams(params, routeParamsSchema);
    const { name, description } = await parseBody(request, updateClassSchema);

    const updatedClass = await prisma.classLevel.update({
      where: { id },
      data: { name, description },
    });
    return NextResponse.json(updatedClass);
  } catch (error) {
    return handleApiError(error, 'Error updating class');
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await parseParams(params, routeParamsSchema);
    await prisma.classLevel.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Class deleted successfully' });
  } catch (error) {
    return handleApiError(error, 'Error deleting class');
  }
}
