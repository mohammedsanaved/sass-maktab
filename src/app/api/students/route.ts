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
       // Combine with classId if present, or just filter by timeSlot
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
      },
      orderBy: { joinedAt: 'desc' },
    });

    return NextResponse.json(students);
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
        grNumber, rollNumber, type, 
        hafizCategory, fullTimeSubCategory,
        admissionFee, monthlyFees,
        status, admissionStatus,
        residence, fullPermanentAddress,
        emergencyContactName, emergencyContactPhone,
        classId, timeSlotId 
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

    // 3. Determine next serial
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

    const nextSerial = String(maxSerial + 1).padStart(3, '0');
    const generatedRollNumber = `${nextSerial}${suffix}`;

    // Prepare data
    const data: any = {
        studentName,
        fatherName,
        gender,
        mobile,
        dateOfBirth: new Date(dateOfBirth),
        grNumber,
        rollNumber: generatedRollNumber, // Auto-generated
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
        // Find the specific session
        const session = await prisma.classSession.findFirst({
            where: {
                classLevelId: classId,
                timeSlotId: timeSlotId
            }
        });

        if (session) {
            data.classSessionId = session.id;
        } else {
             // Optional: Create session on fly? Or return error?
             // Usually teacher must be assigned first?
             // User prompt: "Admin assign Classes" implies admin does it. 
             // If manual assignment:
             return NextResponse.json(
                { error: 'Class Session (Class + Time) not found. Please ensure a teacher is assigned to this slot or create the session.' }, 
                { status: 400 }
             );
        }
    }

    const newStudent = await prisma.student.create({
        data
    });

    console.log('-------------New Student:', newStudent);

    return NextResponse.json(newStudent, { status: 201 });

  } catch (error: any) {
    console.error('Error creating student:', error);
    if (error.code === 'P2002') {
         return NextResponse.json({ error: 'Duplicate Form No, GR No, or Roll Number' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}
