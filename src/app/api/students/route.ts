import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { Prisma } from '@prisma/client';
import { ClientPageRoot } from 'next/dist/client/components/client-page';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const classId = searchParams.get('classId');
    const timeSlotId = searchParams.get('timeSlotId');

    const where: any = {};

    if (status) where.status = status;
    if (classId) where.classSession = { classLevelId: classId };
    if (timeSlotId) {
       // Combine with classId if present, or just filter by classSession
       where.classSession = { 
           ...(where.classSession || {}),
           timeSlotId: timeSlotId 
       };
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        classSession: {
          include: {
            classLevel: true,
            timeSlot: true,
          },
        },
        feePayments: {
            select: { paidMonths: true } // Fetch paid months history
        }
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Dynamic Fee Calculation
    const currentDate = new Date();
    const studentsWithFees = students.map((student) => {
        let totalDues = 0;
        let unpaidMonthsCount = 0;
        let paymentStatus = 'Unpaid'; // Default

        // Only calculate for confirmed students with valid fees
        if (student.admissionStatus === 'COMPLETED' && student.monthlyFees > 0) {
            const joinDate = new Date(student.joinedAt);
            
            // Calculate total months since joining (inclusive of joining month if needed, or simple difference)
            // Logic: (YearDiff * 12) + MonthDiff
            // Assuming fees start from the joining month.
            let monthsSinceJoining = (currentDate.getFullYear() - joinDate.getFullYear()) * 12 + (currentDate.getMonth() - joinDate.getMonth());
            // If currently in the joining month, it counts as 0 difference but we might charge for it? 
            // Usually if joined today, fees due for this month. So +1.
            monthsSinceJoining += 1; 

            if (monthsSinceJoining < 0) monthsSinceJoining = 0;

            // Flatten all paid months from all payments
            // paidMonths is array of strings "YYYY-MM"
            const allPaidMonths = new Set(
                student.feePayments.flatMap(p => p.paidMonths)
            );

            // Logic: Iterate from joining month to current month and check if paid
            // This is more accurate than simple count subtraction because specific months must be paid.
            let unpaidCount = 0;
            let checkDate = new Date(joinDate);
            
            // Iterate month by month up to current month
            // We set date to 1st to avoid end-of-month edge cases when incrementing
            checkDate.setDate(1); 
            
            const currentMonthYearChar = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

            // Loop until checkDate's month-year string is > current month-year string
            // actually simpler: just loop for N months
            for (let i = 0; i < monthsSinceJoining; i++) {
                const year = checkDate.getFullYear();
                const month = String(checkDate.getMonth() + 1).padStart(2, '0');
                const monthStr = `${year}-${month}`;
                
                if (!allPaidMonths.has(monthStr)) {
                    unpaidCount++;
                }
                
                // Move to next month
                checkDate.setMonth(checkDate.getMonth() + 1);
            }

            unpaidMonthsCount = unpaidCount;
            totalDues = unpaidMonthsCount * student.monthlyFees;

            if (unpaidMonthsCount === 0) {
                paymentStatus = 'Paid';
            } else if (unpaidMonthsCount < monthsSinceJoining) {
                paymentStatus = 'Partial';
            } else {
                paymentStatus = 'Unpaid';
            }
        } else if (student.admissionStatus !== 'COMPLETED') {
             paymentStatus = 'N/A'; // Not enrolled
        } else if (student.monthlyFees === 0) {
             paymentStatus = 'Free';
        }

        return {
            ...student,
            totalDues,
            unpaidMonthsCount,
            paymentStatus
        };
    });

    return NextResponse.json(studentsWithFees);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
        studentName, fatherName, gender, mobile, dateOfBirth, 
        formNo, grNumber, type, 
        hafizCategory, fullTimeSubCategory,
        admissionFee, monthlyFees,
        status, admissionStatus,
        residence, fullPermanentAddress,
        emergencyContactName, emergencyContactPhone,
        classId, timeSlotId, academicYear
    } = body;

    // Validate required fields
    if (!studentName || !fatherName || !mobile || !dateOfBirth) {
         return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }


    // Implement Roll Number Generation logic: SerialNumber-MMYYYY (e.g., 001-12-2025)
    // 1. Get current month and year
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const suffix = `-${month}${year}`;

    // 2. Find the last roll number pattern for this month
    // Since rollNumber is a string, we can't easily perform max() on the prefix.
    // We will count students joined in this month. OR better, findMany and parse.
    // Finding all for this month might be safest to ensure no collision.
    
    // Filter matching the text pattern? Prisma 'endsWith'
    const existingStudentsThisMonth = await prisma.student.findMany({
        where: {
            rollNumber: {
                endsWith: suffix
            }
        },
        select: { rollNumber: true }
    });

    // 4. Determine next serial for Roll Number (monthly)
    let maxSerial = 0;
    existingStudentsThisMonth.forEach(s => {
        if (s.rollNumber) {
            const parts = s.rollNumber.split('-');
            const serial = parseInt(parts[0], 10);
            if (!isNaN(serial) && serial > maxSerial) {
                maxSerial = serial;
            }
        }
    });

    const nextRollSerial = String(maxSerial + 1).padStart(3, '0');
    const generatedRollNumber = `${nextRollSerial}${suffix}`;

    // 5. Robust ID Generation for FormNo and GrNo (Inside Transaction)
    const newStudent = await prisma.$transaction(async (tx: any) => {
        
        let finalFormNo = formNo;
        let finalGrNumber = grNumber;

        // Auto-generate Form No if empty
        if (!finalFormNo || finalFormNo.trim() === '') {
            const currentYear = new Date().getFullYear();
            const formPrefix = `F-${currentYear}-`;
            const lastForm = await tx.student.findFirst({
                where: { formNo: { startsWith: formPrefix } },
                orderBy: { formNo: 'desc' },
                select: { formNo: true }
            });

            let nextFormSerial = 1;
            if (lastForm && lastForm.formNo) {
                const parts = lastForm.formNo.split('-');
                const lastSerial = parseInt(parts[2], 10);
                if (!isNaN(lastSerial)) nextFormSerial = lastSerial + 1;
            }
            finalFormNo = `${formPrefix}${String(nextFormSerial).padStart(3, '0')}`;
        }

        // Auto-generate GR Number if empty
        if (!finalGrNumber || finalGrNumber.trim() === '') {
            const lastGr = await tx.student.findFirst({
                where: { grNumber: { startsWith: 'GR-' } },
                orderBy: { grNumber: 'desc' },
                select: { grNumber: true }
            });

            let nextGrSerial = 1001;
            if (lastGr && lastGr.grNumber) {
                const parts = lastGr.grNumber.split('-');
                const lastSerial = parseInt(parts[1], 10);
                if (!isNaN(lastSerial)) nextGrSerial = lastSerial + 1;
            }
            finalGrNumber = `GR-${nextGrSerial}`;
        }

        // Prepare data
        const data: any = {
            studentName,
            fatherName,
            gender,
            mobile,
            dateOfBirth: new Date(dateOfBirth),
            grNumber: finalGrNumber,
            formNo: finalFormNo,
            rollNumber: generatedRollNumber,
            type: type || 'NAZERA',
            hafizCategory, 
            fullTimeSubCategory,
            admissionFee: admissionFee ? parseFloat(admissionFee) : undefined,
            monthlyFees: monthlyFees ? parseFloat(monthlyFees) : 0,
            residence,
            fullPermanentAddress,
            emergencyContactName,
            emergencyContactPhone,
            status: status || 'NEW',
            admissionStatus: admissionStatus || 'COMPLETED',
            joinedAt: new Date(),
        };

        // Handle Class Session assignment
        if (classId && timeSlotId) {
            const session = await tx.classSession.findFirst({
                where: { classLevelId: classId, timeSlotId: timeSlotId }
            });
            if (session) {
                data.classSessionId = session.id;
            } else {
                throw new Error('CLASS_SESSION_NOT_FOUND');
            }
        }

        const student = await tx.student.create({ data });

        // Create initial Enrollment
        if (academicYear && data.classSessionId) {
            await tx.studentEnrollment.create({
                data: {
                    studentId: student.id,
                    classSessionId: data.classSessionId,
                    academicYear: academicYear,
                    isActive: true,
                    resultStatus: 'PENDING'
                }
            });
        }

        return student;
    });

    console.log('-------------New Student:', newStudent);
    return NextResponse.json(newStudent, { status: 201 });

  } catch (error: any) {
    console.error('Error creating student:', error);
    if (error.message === 'CLASS_SESSION_NOT_FOUND') {
        return NextResponse.json(
            { error: 'Class Session (Class + Time) not found. Please ensure a teacher is assigned to this slot.' }, 
            { status: 400 }
        );
    }
    if (error.code === 'P2002') {
         return NextResponse.json({ error: 'Duplicate Form No, GR No, or Roll Number. Please try again.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}
