import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateStudentArrears } from '@/lib/utils/fee-utils';
import { normalizeToMonthStart } from '@/lib/utils/date-utils';
import { z } from 'zod';
import { handleApiError } from '@/lib/server/api-utils';
import { parseBody, parseQuery } from '@/lib/server/validation';

// const prisma = new PrismaClient();

const paymentsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  classId: z.string().optional(),
  timeSlotId: z.string().optional(),
  classSessionId: z.string().optional(),
  status: z.enum(['PAID', 'UNPAID', 'ALL']).optional(),
});

const paymentSchema = z.object({
  studentId: z.string().min(1),
  amount: z.coerce.number().positive(),
  months: z.array(z.string().min(1)).min(1),
  remarks: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { page, limit, search, classId, timeSlotId, classSessionId, status } =
      parseQuery(request, paymentsListQuerySchema);

    // 1. Pagination Params
    const skip = (page - 1) * limit;

    // 2. Filter Params

    // 3. Build Where Query
    const where: Parameters<typeof prisma.student.findMany>[0]['where'] = {
      studyStatus: { in: ['REGULAR', 'IRREGULAR'] },
    };
    where.admissionStatus = 'COMPLETED';

    // Search filter - uses OR for name/rollNumber matching
    if (search) {
      where.OR = [
        { studentName: { contains: search, mode: 'insensitive' } },
        { rollNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (classId || timeSlotId || classSessionId) {
      where.classSession = {
        ...(classId ? { classLevelId: classId } : {}),
        ...(timeSlotId ? { timeSlotId: timeSlotId } : {}),
        ...(classSessionId ? { id: classSessionId } : {}),
      };
    }

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    // Status filter - combine with search using AND logic
    if (status === 'PAID') {
      where.lastFeePaidMonth = {
        gte: currentMonthStart,
      };
    } else if (status === 'UNPAID') {
      // If search already set OR, we need to combine properly
      // Use AND with nested OR for unpaid status
      const unpaidCondition = {
        OR: [
          { lastFeePaidMonth: null },
          { lastFeePaidMonth: { lt: currentMonthStart } },
        ],
      };

      // If search exists, we need to wrap both in AND
      if (search) {
        const searchOr = where.OR;
        delete where.OR;
        where.AND = [{ OR: searchOr }, unpaidCondition];
      } else {
        where.OR = unpaidCondition.OR;
      }
    }

    // 4. Counts for Pagination
    const total = await prisma.student.count({ where });

    // 5. Query
    const students = await prisma.student.findMany({
      where,
      skip,
      take: limit,
      include: {
        classSession: {
          include: {
            classLevel: true,
            timeSlot: true,
          },
        },
        feePayments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { studentName: 'asc' },
    });

    const formattedStudents = students.map((s) => {
      const arrears = calculateStudentArrears(
        { joinedAt: s.joinedAt, feeCategory: s.feeCategory, monthlyFees: s.monthlyFees },
        s.feePayments
      );

      // Get latest payment (feePayments is already sorted desc by paymentDate)
      const latestPayment =
        s.feePayments && s.feePayments.length > 0
          ? {
              paymentDate: s.feePayments[0].paymentDate,
              amount: s.feePayments[0].amount,
              paidMonths: s.feePayments[0].paidMonths || [],
              remarks: s.feePayments[0].remarks || null,
            }
          : null;

      return {
        id: s.id,
        feeCategory: s.feeCategory,
        rollNumber: s.rollNumber,
        studentName: s.studentName,
        fatherName: s.fatherName,
        mobile: s.mobile,
        monthlyFees: s.monthlyFees,
        lastFeePaidMonth: s.lastFeePaidMonth,
        joinedAt: s.joinedAt,
        arrears: {
          months: arrears.months,
          amount: arrears.amount,
        },
        latestPayment,
        classSession: s.classSession
          ? {
              classLevelId: s.classSession.classLevelId,
              classLevelName: s.classSession.classLevel.name,
              timeSlotId: s.classSession.timeSlotId,
              timeSlotLabel: s.classSession.timeSlot.label,
              sectionName: s.classSession.sectionName,
            }
          : null,
      };
    });

    return NextResponse.json({
      data: formattedStudents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, 'Error fetching payments list');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, amount, months, remarks } = await parseBody(
      request,
      paymentSchema
    );

    let maxDate = new Date(0);
    for (const m of months) {
      const d = new Date(m);
      const normalized = normalizeToMonthStart(d);
      if (normalized > maxDate) {
        maxDate = normalized;
      }
    }

    // Generate Unique Receipt Number: R-XXXX-MMYYYY
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const suffix = `-${month}${year}`;

    const result = await prisma.$transaction(async (tx) => {
      // Find existing receipts for this month to get next serial
      const existingReceipts = await tx.feePayment.findMany({
        where: {
          receiptNo: {
            endsWith: suffix,
          },
        },
        select: { receiptNo: true },
      });

      let maxSerial = 0;
      existingReceipts.forEach((p) => {
        if (p.receiptNo) {
          const parts = p.receiptNo.split('-');
          const serial = parseInt(parts[1], 10);
          if (!isNaN(serial) && serial > maxSerial) {
            maxSerial = serial;
          }
        }
      });

      const nextSerial = String(maxSerial + 1).padStart(4, '0');
      const generatedReceiptNo = `R-${nextSerial}${suffix}`;

      const payment = await tx.feePayment.create({
        data: {
          studentId,
          amount,
          paymentDate: new Date(),
          paymentType: 'MONTHLY',
          paidMonths: months, // Use the months array from the body
          receiptNo: generatedReceiptNo,
          remarks:
            remarks || `Paid for ${months.length} months: ${months.join(', ')}`,
        },
      });

      const student = await tx.student.findUnique({ where: { id: studentId } });

      if (student) {
        const currentLastPaid = student.lastFeePaidMonth
          ? new Date(student.lastFeePaidMonth)
          : new Date(0);
        if (maxDate > currentLastPaid) {
          await tx.student.update({
            where: { id: studentId },
            data: { lastFeePaidMonth: maxDate },
          });
        }
      }

      return payment;
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, 'Payment processing error');
  }
}
