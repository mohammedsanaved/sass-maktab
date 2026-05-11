import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
// import { StudyStatus } from '@prisma/client';

export async function GET() {
  try {
    // Group by studyStatus and count
    const statusCounts = await prisma.student.groupBy({
      by: ['studyStatus'],
      _count: {
        studyStatus: true,
      },
    });

    // Initialize defaults
    let regular = 0;
    let irregular = 0;
    let completed = 0;

    statusCounts.forEach((item) => {
        if (item.studyStatus === "REGULAR") regular = item._count.studyStatus;
        if (item.studyStatus === "IRREGULAR") irregular = item._count.studyStatus;
        if (item.studyStatus === "COMPLETED") completed = item._count.studyStatus;
    });

    return NextResponse.json({
        regular,
        irregular,
        completed,
        total: regular + irregular + completed
    });

  } catch (error) {
    console.error('Error fetching attendance status:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance status' }, { status: 500 });
  }
}
