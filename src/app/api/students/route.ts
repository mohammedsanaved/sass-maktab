import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { Prisma } from '@prisma/client';
import { calculateStudentArrears } from '@/lib/utils/fee-utils';
import { AdmissionStatus } from '@/types';
import { ClientPageRoot } from 'next/dist/client/components/client-page';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studyStatus = searchParams.get('studyStatus');
    const classId = searchParams.get('classId');
    const timeSlotId = searchParams.get('timeSlotId');
    const academicYear = searchParams.get('academicYear');
    
    // Yearly Reset Logic for Meetings
    // If last reset was more than 365 days ago, reset all students' meeting attendance
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Find if any student needs reset (or just check a global setting if we had one)
    // Here we'll do it per student list fetch for simplicity or better, a batch update if needed.
    // For performance, we can just check if any student has a lastReset < oneYearAgo
    const needsResetCount = await prisma.student.count({
        where: {
            OR: [
                { meetingsLastReset: { lt: oneYearAgo } },
                { meetingsLastReset: null }
            ]
        }
    });

    if (needsResetCount > 0) {
        await prisma.student.updateMany({
            where: {
                OR: [
                    { meetingsLastReset: { lt: oneYearAgo } },
                    { meetingsLastReset: null }
                ]
            },
            data: {
                meetingAttendance: ['pending', 'pending', 'pending'],
                meetingsLastReset: new Date()
            }
        });
    }

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const skip = (page - 1) * limit;
    
    // Search parameter
    const search = searchParams.get('search') || searchParams.get('q') || '';

    const where: any = {
        admissionStatus: { in: ['COMPLETED', 'IN_PROGRESS'] },
    };

    if (status) where.status = status;
    if (studyStatus) where.studyStatus = studyStatus;
    if (classId) where.classSession = { classLevelId: classId };
    if (timeSlotId) {
       // Combine with classId if present, or just filter by classSession
       where.classSession = { 
           ...(where.classSession || {}),
           timeSlotId: timeSlotId 
       };
    }
    
    // Add academicYear filter - filter by enrollment academicYear
    if (academicYear) {
      where.enrollments = {
        some: {
          academicYear: academicYear
        }
      };
    }
    
    // Add search filter
    if (search) {
      where.OR = [
        { studentName: { contains: search, mode: 'insensitive' } },
        { rollNumber: { contains: search, mode: 'insensitive' } },
        { grNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination metadata
    const total = await prisma.student.count({ where });

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
        },
        enrollments: {
          include: {
            classSession: {
              include: {
                classLevel: true,
                timeSlot: true
              }
            }
          },
          orderBy: { createdAt: 'desc' } // Most recent first
        }
      },
      orderBy: { joinedAt: 'desc' },
      skip,
      take: limit,
    });

    // Dynamic Fee Calculation
    const currentDate = new Date();
    const studentsWithFees = students.map((student) => {
        let totalDues = 0;
        let unpaidMonthsCount = 0;
        let paymentStatus = 'Unpaid'; // Default

        if (student.admissionStatus === AdmissionStatus.COMPLETED) {
            const arrears = calculateStudentArrears(student, student.feePayments);
            
            unpaidMonthsCount = arrears.months;
            totalDues = arrears.amount;

            if (unpaidMonthsCount === 0) {
                paymentStatus = 'Paid';
            } else {
                paymentStatus = 'Unpaid';
            }
        }
 else if (student.admissionStatus !== 'COMPLETED') {
             paymentStatus = 'N/A'; // Not enrolled
        } else if (student.monthlyFees === 0 || (student.feeCategory !== 'REGULAR' && student.feeCategory !== 'SPONSORED')) {
             paymentStatus = 'Free';
        }

        return {
            ...student,
            totalDues,
            unpaidMonthsCount,
            paymentStatus
        };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
        data: studentsWithFees,
        pagination: {
            total,
            page,
            limit,
            totalPages
        }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
        studentName, fatherName, gender, mobile, dateOfBirth, age,
        formNo, grNumber, type, 
        hafizCategory, fullTimeSubCategory,
        admissionFee, monthlyFees,
        status, admissionStatus, studyStatus,
        residence, fullPermanentAddress,
        parentGuardianOccupation, previousSchool,
        emergencyContactName, emergencyContactPhone,
        remarks,
        classId, timeSlotId, academicYear,
        feeCategory, sponsorName, sponsorContact
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
            age: age ? parseInt(age) : undefined,
            grNumber: finalGrNumber,
            formNo: finalFormNo,
            rollNumber: generatedRollNumber,
            type: type || 'NAZERA',
            hafizCategory, 
            fullTimeSubCategory,
            admissionFee: admissionFee ? parseFloat(admissionFee) : undefined,
            monthlyFees: monthlyFees ? parseFloat(monthlyFees) : 0,
            feeCategory: feeCategory || 'REGULAR',
            sponsorName: feeCategory === 'SPONSORED' ? sponsorName : undefined,
            sponsorContact: feeCategory === 'SPONSORED' ? sponsorContact : undefined,
            residence,
            fullPermanentAddress,
            parentGuardianOccupation,
            previousTraining: previousSchool, // Map previousSchool from form to previousTraining in schema
            emergencyContactName,
            emergencyContactPhone,
            remarks,
            status: status || 'NEW',
            admissionStatus: admissionStatus || 'COMPLETED',
            studyStatus: studyStatus || 'REGULAR',
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
