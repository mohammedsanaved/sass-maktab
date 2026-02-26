import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { AdmissionStatus } from '@/types';
import { z } from 'zod';
import { ApiError, handleApiError } from '@/lib/server/api-utils';
import { parseBody, parseQuery } from '@/lib/server/validation';

const admissionApplicationsQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const updateAdmissionStatusSchema = z.object({
  studentId: z.string().min(1),
  status: z.nativeEnum(AdmissionStatus),
});

export async function GET(request: Request) {
  try {
    const { status, page, limit } = parseQuery(
      request,
      admissionApplicationsQuerySchema
    );
    const skip = (page - 1) * limit;

    const where: Parameters<typeof prisma.student.findMany>[0]['where'] = {};
    
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
    return handleApiError(error, 'Error fetching admission applications');
  }
}

export async function PUT(request: Request) {
    try {
        const { studentId, status } = await parseBody(
          request,
          updateAdmissionStatusSchema
        );

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
        if (error instanceof ApiError) {
          return handleApiError(error, 'Error updating admission status');
        }
        return handleApiError(error, 'Error updating admission status');
    }
}
