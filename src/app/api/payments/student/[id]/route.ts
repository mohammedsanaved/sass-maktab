import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Pagination & Search Params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build Where Clause
    const where: any = { studentId: id };

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
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
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
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}
