import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { calculateStudentArrears } from '@/lib/utils/fee-utils';
import { AdmissionStatus } from '@/types';
import { z } from 'zod';
import { ApiError, handleApiError } from '@/lib/server/api-utils';
import { parseBody, parseQuery } from '@/lib/server/validation';

const studentsListQuerySchema = z.object({
  status: z.string().optional(),
  studyStatus: z.string().optional(),
  classId: z.string().optional(),
  timeSlotId: z.string().optional(),
  academicYear: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
  search: z.string().optional(),
  q: z.string().optional(),
});

const createStudentSchema = z.object({
  studentName: z.string().trim().min(1),
  fatherName: z.string().trim().min(1),
  gender: z.string().optional(),
  mobile: z.string().trim().min(1),
  dateOfBirth: z.union([z.string(), z.date()]),
  age: z.union([z.string(), z.number()]).optional(),
  formNo: z.string().optional(),
  grNumber: z.string().optional(),
  type: z.string().optional(),
  hafizCategory: z.string().optional(),
  fullTimeSubCategory: z.string().optional(),
  admissionFee: z.union([z.string(), z.number()]).optional(),
  monthlyFees: z.union([z.string(), z.number()]).optional(),
  status: z.string().optional(),
  admissionStatus: z.string().optional(),
  studyStatus: z.string().optional(),
  residence: z.string().optional(),
  fullPermanentAddress: z.string().optional(),
  parentGuardianOccupation: z.string().optional(),
  previousSchool: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  remarks: z.string().optional(),
  classId: z.string().optional(),
  timeSlotId: z.string().optional(),
  academicYear: z.string().optional(),
  feeCategory: z.string().optional(),
  sponsorName: z.string().optional(),
  sponsorContact: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const {
      status,
      studyStatus,
      classId,
      timeSlotId,
      academicYear,
      page,
      limit,
      search,
      q,
    } = parseQuery(request, studentsListQuerySchema);
    
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
    const skip = (page - 1) * limit;
    
    // Search parameter
    const resolvedSearch = search || q || '';

    const where: Parameters<typeof prisma.student.findMany>[0]['where'] = {
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
    if (resolvedSearch) {
      where.OR = [
        { studentName: { contains: resolvedSearch, mode: 'insensitive' } },
        { rollNumber: { contains: resolvedSearch, mode: 'insensitive' } },
        { grNumber: { contains: resolvedSearch, mode: 'insensitive' } }
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
    return handleApiError(error, 'Error fetching students');
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, createStudentSchema);
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
    const newStudent = await prisma.$transaction(async (tx) => {
        
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
        type StudentCreateData = Parameters<typeof tx.student.create>[0]['data'];
        const data: StudentCreateData = {
            studentName,
            fatherName,
            gender,
            mobile,
            dateOfBirth: new Date(dateOfBirth),
            age: age ? Number(age) : undefined,
            grNumber: finalGrNumber,
            formNo: finalFormNo,
            rollNumber: generatedRollNumber,
            type: type || 'NAZERA',
            hafizCategory, 
            fullTimeSubCategory,
            admissionFee: admissionFee ? Number(admissionFee) : undefined,
            monthlyFees: monthlyFees ? Number(monthlyFees) : 0,
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
                throw new ApiError(
                  400,
                  'Class Session (Class + Time) not found. Please ensure a teacher is assigned to this slot.'
                );
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

    return NextResponse.json(newStudent, { status: 201 });

  } catch (error) {
    return handleApiError(error, 'Error creating student');
  }
}
