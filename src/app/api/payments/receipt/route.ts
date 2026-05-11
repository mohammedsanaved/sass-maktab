import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId'); // Retrieve latest for student
        const paymentId = searchParams.get('paymentId'); // Retrieve specific

        if (!studentId && !paymentId) {
            return NextResponse.json({ error: "Student ID or Payment ID required" }, { status: 400 });
        }

        let payment;
        
        if (paymentId) {
             payment = await prisma.feePayment.findUnique({
                 where: { id: paymentId },
                 include: {
                     student: {
                         include: {
                             classSession: {
                                 include: {
                                     classLevel: true,
                                     timeSlot: true
                                 }
                             }
                         }
                     }
                 }
             });
        } else if (studentId) {
             // Get latest
             payment = await prisma.feePayment.findFirst({
                 where: { studentId },
                 orderBy: { paymentDate: 'desc' },
                 include: {
                     student: {
                         include: {
                             classSession: {
                                 include: {
                                     classLevel: true,
                                     timeSlot: true
                                 }
                             }
                         }
                     }
                 }
             });
        }

        if (!payment) {
            return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
        }

        // Format for Receipt UI
        const receiptData = {
           receiptNo: payment.receiptNo || `REC-${payment.id.slice(-6).toUpperCase()}`,
           date: payment.paymentDate,
           amount: payment.amount,
           remarks: payment.remarks,
           student: {
               name: payment.student.studentName,
               rollNumber: payment.student.rollNumber,
               fatherName: payment.student.fatherName,
               mobile: payment.student.mobile,
               class: payment.student.classSession?.classLevel.name,
               section: payment.student.classSession?.sectionName,
               timeSlot: payment.student.classSession?.timeSlot.label
           }
        };

        return NextResponse.json(receiptData);

    } catch (error) {
        console.error("Error fetching receipt:", error);
        return NextResponse.json({ error: "Failed to fetch receipt" }, { status: 500 });
    }
}
