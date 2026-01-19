import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        classSession: {
            include: { classLevel: true, timeSlot: true }
        },
        feePayments: {
            orderBy: { paymentDate: 'desc' }
        }
      }
    });

    if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Arrears Calculation Logic
    const referenceDate = new Date();
    referenceDate.setDate(1);
    referenceDate.setHours(0, 0, 0, 0);

    let arrearsMonths = 0;
    let arrearsAmount = 0;

    const joinDate = new Date(student.joinedAt);
    const startCalculationFrom = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
    
    // Collect all paid months across all transactions
    const allPaidMonths = new Set<string>();
    student.feePayments.forEach((p: any) => {
        if (p.paidMonths) {
            p.paidMonths.forEach((m: string) => allPaidMonths.add(m));
        }
    });

    // Loop from startCalculationFrom to (but not including) referenceDate
    // This makes the current month's fee NOT an arrear until next month starts.
    let tempDate = new Date(startCalculationFrom);
    while (tempDate < referenceDate) {
        const monthStr = tempDate.toISOString().substring(0, 7);
        if (!allPaidMonths.has(monthStr)) {
            arrearsMonths++;
            arrearsAmount += student.monthlyFees;
        }
        tempDate.setMonth(tempDate.getMonth() + 1);
    }

    const studentWithArrears = {
        ...student,
        previousSchool: (student as any).previousTraining, // Map previousTraining to previousSchool for frontend consistency
        arrears: {
            months: arrearsMonths,
            amount: arrearsAmount
        }
    };

    return NextResponse.json(studentWithArrears);
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    // Allow updating almost all fields
    const { 
        studentName, fatherName, gender, mobile, dateOfBirth, age,
        grNumber, rollNumber, type, 
        hafizCategory, fullTimeSubCategory,
        admissionFee, monthlyFees,
        residence, fullPermanentAddress,
        parentGuardianOccupation, previousSchool,
        emergencyContactName, emergencyContactPhone,
        remarks,
        classId, timeSlotId,
        status, admissionStatus, studyStatus
    } = body;

    const data: any = {};
    if (studentName !== undefined) data.studentName = studentName;
    if (fatherName !== undefined) data.fatherName = fatherName;
    if (gender !== undefined) data.gender = gender;
    if (mobile !== undefined) data.mobile = mobile;
    if (dateOfBirth !== undefined) data.dateOfBirth = new Date(dateOfBirth);
    if (age !== undefined) data.age = age ? parseInt(age) : undefined;
    if (grNumber !== undefined) data.grNumber = grNumber;
    if (rollNumber !== undefined) data.rollNumber = rollNumber;
    if (type !== undefined) data.type = type;
    if (hafizCategory !== undefined) data.hafizCategory = hafizCategory;
    if (fullTimeSubCategory !== undefined) data.fullTimeSubCategory = fullTimeSubCategory;
    if (admissionFee !== undefined) data.admissionFee = parseFloat(admissionFee);
    if (monthlyFees !== undefined) data.monthlyFees = parseFloat(monthlyFees);
    if (residence !== undefined) data.residence = residence;
    if (fullPermanentAddress !== undefined) data.fullPermanentAddress = fullPermanentAddress;
    if (parentGuardianOccupation !== undefined) data.parentGuardianOccupation = parentGuardianOccupation;
    if (previousSchool !== undefined) data.previousTraining = previousSchool; // Map previousSchool to previousTraining
    if (emergencyContactName !== undefined) data.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) data.emergencyContactPhone = emergencyContactPhone;
    if (remarks !== undefined) data.remarks = remarks;
    if (status !== undefined) data.status = status;
    if (admissionStatus !== undefined) {
        data.admissionStatus = admissionStatus;
        
        // Logical Trigger: If status is being updated to COMPLETED, 
        // we reset joinedAt to 'now' so fees start from this month.
        const currentStudent = await prisma.student.findUnique({ 
            where: { id },
            select: { admissionStatus: true }
        });
        
        if (admissionStatus === 'COMPLETED' && currentStudent?.admissionStatus !== 'COMPLETED') {
            data.joinedAt = new Date();
        }
    }
    if (studyStatus !== undefined) data.studyStatus = studyStatus;

    if (classId && timeSlotId) {
        const session = await prisma.classSession.findFirst({
            where: { classLevelId: classId, timeSlotId: timeSlotId }
        });
        if (session) {
            data.classSessionId = session.id;
            
            // AUTOMATICALLY SYNC ENROLLMENT
            // If class is changing, find the active enrollment and update it too.
            // This treats the edit as a "Correction" rather than a "Promotion".
            const activeEnrollment = await prisma.studentEnrollment.findFirst({
                where: { studentId: id, isActive: true }
            });
            
            if (activeEnrollment) {
                await prisma.studentEnrollment.update({
                    where: { id: activeEnrollment.id },
                    data: { classSessionId: session.id }
                });
            } else {
                // If no active enrollment exists (maybe new student or migration issue), create one?
                // For now, let's just create one to be safe, defaulting to current academic year if needed,
                // but since we don't have academicYear in this payload easily, we might skip or use a default.
                // Safest is to only update if exists. If not exists, the Migration script should handle it.
            }
        }
    }

    const updatedStudent = await prisma.student.update({
        where: { id },
        data
    });

    return NextResponse.json(updatedStudent);

  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}
