import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError } from '@/lib/server/api-utils';

export async function GET() {
  try {
    const years = await prisma.studentEnrollment.findMany({
      distinct: ['academicYear'],
      select: {
        academicYear: true,
      },
      orderBy: {
        academicYear: 'desc',
      },
    });

    const formattedYears = years.map((y) => ({
      value: y.academicYear,
      label: y.academicYear,
    }));

    return NextResponse.json(formattedYears);
  } catch (error) {
    return handleApiError(error, 'Error fetching academic years');
  }
}
