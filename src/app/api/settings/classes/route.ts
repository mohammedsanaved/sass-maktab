import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '../../../../lib/prisma';
import { handleApiError } from '@/lib/server/api-utils';
import { parseBody } from '@/lib/server/validation';

const createClassSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
});

export async function GET() {
  try {
    const classes = await prisma.classLevel.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(classes);
  } catch (error) {
    return handleApiError(error, 'Error fetching classes');
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await parseBody(request, createClassSchema);

    const newClass = await prisma.classLevel.create({
      data: { name, description },
    });
    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Error creating class');
  }
}
