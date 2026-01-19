import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    console.error('Error fetching academic years:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academic years' },
      { status: 500 }
    );
  }
}
