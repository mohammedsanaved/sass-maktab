import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '../../../../lib/prisma';
import { handleApiError } from '@/lib/server/api-utils';
import { parseQuery } from '@/lib/server/validation';

const searchStudentsQuerySchema = z.object({
  q: z.string().trim().optional(),
});

export async function GET(request: Request) {
  try {
    const { q } = parseQuery(request, searchStudentsQuerySchema);

    if (!q) {
        return NextResponse.json([]);
    }

    const students = await prisma.student.findMany({
      where: {
        OR: [
            { studentName: { contains: q, mode: 'insensitive' } },
            { rollNumber: { contains: q, mode: 'insensitive' } },
            { grNumber: { contains: q, mode: 'insensitive' } } // Gr No from UI
        ]
      },
      include: {
        classSession: {
          include: {
             classLevel: true
          }
        }
      },
      take: 20
    });

    return NextResponse.json(students);
  } catch (error) {
    return handleApiError(error, 'Error searching students');
  }
}
