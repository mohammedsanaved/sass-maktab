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

    // 3.1 Search (Name or Roll Number)
    if (search) {
      where.OR = [
        { studentName: { contains: search, mode: 'insensitive' } },
        { rollNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 3.2 Class & TimeSlot Filter
    // Because Student -> ClassSession -> ClassLevel/TimeSlot
    if (classId || timeSlotId) {
       where.classSession = {
           ...(classId ? { classLevelId: classId } : {}),
           ...(timeSlotId ? { timeSlotId: timeSlotId } : {})
       };
    }

    // 3.3 Status Filter (PAID / UNPAID)
    // "PAID" means paid for the CURRENT month.
    // "UNPAID" means not paid for the CURRENT month.
    // Logic: compare lastFeePaidMonth with current month start.
    // Prisma filters for date comparison:
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
    
    // Always active students? or all? Assuming active for now unless specified otherwise.
    // where.isActive = true; 

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
            take: 1 // Get latest payment just in case needed for UI extras
        }
      },
      orderBy: { studentName: 'asc' } // Default sort
    });
    
    // 6. Format Response
    const formattedStudents = students.map((s: any) => ({
        id: s.id,
        rollNumber: s.rollNumber,
        studentName: s.studentName,
        fatherName: s.fatherName,
        mobile: s.mobile,
        monthlyFees: s.monthlyFees,
        lastFeePaidMonth: s.lastFeePaidMonth,
        classSession: s.classSession ? {
            classLevelId: s.classSession.classLevelId,
            classLevelName: s.classSession.classLevel.name,
            timeSlotId: s.classSession.timeSlotId,
            timeSlotLabel: s.classSession.timeSlot.label,
            sectionName: s.classSession.sectionName
        } : null
    }));

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
        
        // Validation
        if (!studentId || !amount || !months || months.length === 0) {
             return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Calculate the latest month paid to update Student Record
        // Input 'months' is expected to be an array of "YYYY-MM" strings or ISO dates
        // We need to find the MAX date in this array.
        let maxDate = new Date(0); // Epoch
        
        for (const m of months) {
            // Assuming format "YYYY-MM" or ISO
            const d = new Date(m); 
            // Set to 1st of month to avoid timezone shifting issues on boundaries if simple parsing
            const normalized = new Date(d.getFullYear(), d.getMonth(), 1);
            if (normalized > maxDate) {
                maxDate = normalized;
            }
        }

        // 2. Transaction: Create Payment & Update Student
        const result = await prisma.$transaction(async (tx: any) => {
            
            // Create Payment Record
            const payment = await tx.feePayment.create({
                data: {
                    studentId,
                    amount: parseFloat(amount),
                    paymentDate: new Date(),
                    paymentType: 'MONTHLY', // Generalizing for this flow
                    remarks: remarks || `Paid for ${months.length} months: ${months.join(', ')}`
                }
            });

            // Update Student lastFeePaidMonth ONLY if it's simpler/newer
            // Actually, we should check: if the student has already paid for NEXT year, 
            // and we rely on maxDate, we must ensure we don't accidentally BACKDATE if they are just paying arrears.
            // But usually paynow/advance implies moving the date forward.
            // Let's fetch current to be safe.
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
