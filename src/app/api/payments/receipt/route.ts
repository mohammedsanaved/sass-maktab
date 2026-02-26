import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { ApiError, handleApiError } from '@/lib/server/api-utils';
import { parseQuery } from '@/lib/server/validation';

const receiptQuerySchema = z.object({
  studentId: z.string().optional(),
  paymentId: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const { studentId, paymentId } = parseQuery(request, receiptQuerySchema);

        if (!studentId && !paymentId) {
            throw new ApiError(400, 'Student ID or Payment ID required');
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
            throw new ApiError(404, 'Receipt not found');
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
        return handleApiError(error, 'Error fetching receipt');
    }
}
