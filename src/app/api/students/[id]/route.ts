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
        }
      }
    });

    if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(student);
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
        studentName, fatherName, gender, mobile, dateOfBirth, 
        grNumber, rollNumber, type, 
        admissionFee, monthlyFees,
        residence, fullPermanentAddress,
        emergencyContactName, emergencyContactPhone,
        classId, timeSlotId,
        status, admissionStatus
    } = body;

    const data: any = {};
    if (studentName) data.studentName = studentName;
    if (fatherName) data.fatherName = fatherName;
    if (gender) data.gender = gender;
    if (mobile) data.mobile = mobile;
    if (dateOfBirth) data.dateOfBirth = new Date(dateOfBirth);
    if (grNumber) data.grNumber = grNumber;
    if (rollNumber) data.rollNumber = rollNumber;
    if (type) data.type = type;
    if (admissionFee) data.admissionFee = parseFloat(admissionFee);
    if (monthlyFees) data.monthlyFees = parseFloat(monthlyFees);
    if (residence) data.residence = residence;
    if (fullPermanentAddress) data.fullPermanentAddress = fullPermanentAddress;
    if (emergencyContactName) data.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone) data.emergencyContactPhone = emergencyContactPhone;
    if (status) data.status = status;
    if (admissionStatus) data.admissionStatus = admissionStatus;

    if (classId && timeSlotId) {
        const session = await prisma.classSession.findFirst({
            where: { classLevelId: classId, timeSlotId: timeSlotId }
        });
        if (session) data.classSessionId = session.id;
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
