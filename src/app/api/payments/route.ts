import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Pagination Params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // 2. Filter Params
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId');
    const timeSlotId = searchParams.get('timeSlotId');
    const status = searchParams.get('status'); // 'PAID', 'UNPAID', 'ALL' || null

    // 3. Build Where Query
    const where: any = {};

    if (search) {
      where.OR = [
        { studentName: { contains: search, mode: 'insensitive' } },
        { rollNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (classId || timeSlotId) {
       where.classSession = {
           ...(classId ? { classLevelId: classId } : {}),
           ...(timeSlotId ? { timeSlotId: timeSlotId } : {})
       };
    }

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    if (status === 'PAID') {
        where.lastFeePaidMonth = {
            gte: currentMonthStart
        };
    } else if (status === 'UNPAID') {
        where.OR = [
            { lastFeePaidMonth: null },
            { lastFeePaidMonth: { lt: currentMonthStart } }
        ];
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
          }
        },
        feePayments: {
            orderBy: { paymentDate: 'desc' },
        }
      },
      orderBy: { studentName: 'asc' } 
    });
    
    // 6. Arrears Calculation Logic
    // Reference start Date: July 1st, 2025
    const arrearsStartDate = new Date(2025, 6, 1); // July is index 6
    const referenceDate = new Date(); 
    referenceDate.setDate(1);
    referenceDate.setHours(0, 0, 0, 0);

    const formattedStudents = students.map((s: any) => {
        let arrearsMonths = 0;
        let arrearsAmount = 0;

        const joinDate = new Date(s.joinedAt);
        const startCalculationFrom = joinDate > arrearsStartDate ? new Date(joinDate.getFullYear(), joinDate.getMonth(), 1) : arrearsStartDate;
        
        // Collect all paid months across all transactions
        const allPaidMonths = new Set<string>();
        s.feePayments.forEach((p: any) => {
            if (p.paidMonths) {
                p.paidMonths.forEach((m: string) => allPaidMonths.add(m));
            }
        });

        // Loop from startCalculationFrom to referenceDate (current month inclusive)
        let tempDate = new Date(startCalculationFrom);
        while (tempDate <= referenceDate) {
            const monthStr = tempDate.toISOString().substring(0, 7);
            if (!allPaidMonths.has(monthStr)) {
                arrearsMonths++;
                arrearsAmount += s.monthlyFees;
            }
            tempDate.setMonth(tempDate.getMonth() + 1);
        }

        return {
            id: s.id,
            rollNumber: s.rollNumber,
            studentName: s.studentName,
            fatherName: s.fatherName,
            mobile: s.mobile,
            monthlyFees: s.monthlyFees,
            lastFeePaidMonth: s.lastFeePaidMonth,
            joinedAt: s.joinedAt,
            arrears: {
                months: arrearsMonths,
                amount: arrearsAmount
            },
            classSession: s.classSession ? {
                classLevelId: s.classSession.classLevelId,
                classLevelName: s.classSession.classLevel.name,
                timeSlotId: s.classSession.timeSlotId,
                timeSlotLabel: s.classSession.timeSlot.label,
                sectionName: s.classSession.sectionName
            } : null
        };
    });

    return NextResponse.json({
      data: formattedStudents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching payments list:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { studentId, amount, months, remarks } = body; 
        
        if (!studentId || !amount || !months || months.length === 0) {
             return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let maxDate = new Date(0);
        for (const m of months) {
            const d = new Date(m); 
            const normalized = new Date(d.getFullYear(), d.getMonth(), 1);
            if (normalized > maxDate) {
                maxDate = normalized;
            }
        }

        const result = await prisma.$transaction(async (tx: any) => {
            const payment = await tx.feePayment.create({
                data: {
                    studentId,
                    amount: parseFloat(amount),
                    paymentDate: new Date(),
                    paymentType: 'MONTHLY',
                    paidMonths: months, // Use the months array from the body
                    remarks: remarks || `Paid for ${months.length} months: ${months.join(', ')}`
                }
            });

            const student = await tx.student.findUnique({ where: { id: studentId } });
            
            if (student) {
                const currentLastPaid = student.lastFeePaidMonth ? new Date(student.lastFeePaidMonth) : new Date(0);
                 if (maxDate > currentLastPaid) {
                     await tx.student.update({
                         where: { id: studentId },
                         data: { lastFeePaidMonth: maxDate }
                     });
                 }
            }
            
            return payment;
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error("Payment processing error:", error);
        return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
    }
}
