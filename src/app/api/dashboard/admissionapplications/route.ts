import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { AdmissionStatus, Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (status && status !== 'ALL') {
      // Validate if status is a valid AdmissionStatus
      if (Object.values(AdmissionStatus).includes(status as AdmissionStatus)) {
         where.admissionStatus = status as AdmissionStatus;
      }
    } else {
        // If no specific status filter, usually we want to see PENDING/IN_PROGRESS or everything
        // Dashboard UI shows everything if 'ALL' is selected.
    }

    // Get total count for pagination
    const total = await prisma.student.count({ where });

    // Get data
    const students = await prisma.student.findMany({
      where,
      skip,
      take: limit,
      include: {
        classSession: {
            include: {
                classLevel: true,
                timeSlot: true
            }
        }
      },
      orderBy: [
        // Prioritize PENDING and IN_PROGRESS
        { admissionStatus: 'asc' }, 
        { updatedAt: 'desc' }
      ]
    });

    return NextResponse.json({
        data: students,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    });

  } catch (error) {
    console.error('Error fetching admission applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { studentId, status } = body;

        if (!studentId || !status) {
            return NextResponse.json({ error: 'Student ID and Status are required' }, { status: 400 });
        }

        if (!Object.values(AdmissionStatus).includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const updatedStudent = await prisma.student.update({
            where: { id: studentId },
            data: { 
                admissionStatus: status,
                // If confirmed, update main status if needed? 
                // Schema has 'status' (StudentStatus: NEW/OLD) and 'admissionStatus'.
                // UI logic: If confirmed, it might imply became a student.
                // For now just update admissionStatus.
            }
        });

        return NextResponse.json(updatedStudent);

    } catch (error) {
        console.error('Error updating admission status:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
