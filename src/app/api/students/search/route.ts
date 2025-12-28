import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json([]);
    }

    const students = await prisma.student.findMany({
      where: {
        OR: [
            { studentName: { contains: query, mode: 'insensitive' } },
            { rollNumber: { contains: query, mode: 'insensitive' } },
            { grNumber: { contains: query, mode: 'insensitive' } } // Gr No from UI
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
    console.error('Error searching students:', error);
    return NextResponse.json({ error: 'Failed to search students' }, { status: 500 });
  }
}
