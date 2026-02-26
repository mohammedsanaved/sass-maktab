import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { ApiError, handleApiError } from '@/lib/server/api-utils';
import { parseParams, parseQuery } from '@/lib/server/validation';

const routeParamsSchema = z.object({
  id: z.string().min(1),
});

const paymentHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await parseParams(params, routeParamsSchema);
    const { page, limit, search } = parseQuery(request, paymentHistoryQuerySchema);

    // Pagination & Search Params
    const skip = (page - 1) * limit;

    // Build Where Clause
    const where: Parameters<typeof prisma.feePayment.findMany>[0]['where'] = {
      studentId: id,
    };

    if (search) {
        where.receiptNo = { contains: search, mode: 'insensitive' };
    }

    // Fetch student details (only once, no need to repeat per page technically, but keeps response simple)
    const student = await prisma.student.findUnique({
      where: { id },
      select: {
          id: true,
          studentName: true,
          fatherName: true,
          rollNumber: true,
          monthlyFees: true,
          lastFeePaidMonth: true,
          joinedAt: true,
          classSession: {
              select: {
                  classLevel: { select: { name: true } }
              }
          }
      }
    });

    if (!student) {
        throw new ApiError(404, 'Student not found');
    }

    // Count Total
    const total = await prisma.feePayment.count({ where });

    // Fetch payments sorted by date desc with pagination
    const payments = await prisma.feePayment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
        student: {
            ...student,
            classLevelName: student.classSession?.classLevel?.name || 'N/A'
        },
        payments,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    });

  } catch (error) {
    return handleApiError(error, 'Error fetching payment history');
  }
}
