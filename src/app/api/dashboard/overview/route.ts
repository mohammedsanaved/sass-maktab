import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
// import { StudentType } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    const now = new Date();
    const year = yearParam ? parseInt(yearParam) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam) : now.getMonth(); // 0-11

    // 1. Total Students (Active)
    const totalStudents = await prisma.student.count({
      where: { isActive: true, admissionStatus: 'COMPLETED' },
    });

    // 2. Hafiz and Nazera Counts (for breakdown if needed, UI uses it in card 1)
    const hafizCount = await prisma.student.count({
      where: { isActive: true, type: 'HAFIZ', admissionStatus: 'COMPLETED' },
    });
    const nazeraCount = await prisma.student.count({
      where: { isActive: true, type: 'NAZERA', admissionStatus: 'COMPLETED' },
    });
    const teacherCount = await prisma.teacher.count({
      where: { role: 'TEACHER' },
    });
    const timeSlotsCount = await prisma.timeSlot.count();
    const classCount = await prisma.classLevel.count();

    // 3. New Admissions in selected Month
    // Need start and end date of the month
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    const newAdmissionsCount = await prisma.student.count({
      where: {
        // Assuming joinedAt corresponds to admission date
        joinedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        admissionStatus: 'COMPLETED'
      },
    });

    // 4. Revenue in selected Month (Attribution-based)
    const targetMonthStr = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    
    // Fetch all payments that either:
    // a) Mention this month in paidMonths
    // b) Are NOT monthly and paid in this month
    // c) Are monthly, have NO paidMonths, but paid in this month (legacy support)
    const payments = await prisma.feePayment.findMany({
      where: {
        // admissionStatus: 'COMPLETED',
        OR: [
          { paidMonths: { has: targetMonthStr } },
          {
            AND: [
              { paymentType: { not: 'MONTHLY' } },
              { paymentDate: { gte: startOfMonth, lte: endOfMonth } }
            ]
          },
          {
            AND: [
              { paidMonths: { isEmpty: true } },
              { paymentType: 'MONTHLY' },
              { paymentDate: { gte: startOfMonth, lte: endOfMonth } }
            ]
          }
        ]
      }
    });

    let collectedFee = 0;
    payments.forEach(p => {
      if (p.paymentType === 'MONTHLY' && p.paidMonths && p.paidMonths.length > 0) {
        // If it's a new record with month tracking, attribute only the proportional amount
        if (p.paidMonths.includes(targetMonthStr)) {
          collectedFee += p.amount / p.paidMonths.length;
        }
      } else {
        // Admission, Donation, or legacy Monthly record
        collectedFee += p.amount;
      }
    });

    // 5. Unpaid Students
    // Logic: Active students whose lastFeePaidMonth is BEFORE the target month.
    // If lastFeePaidMonth is null, they haven't paid at all (unpaid).
    // Note: If lastFeePaidMonth is in previous year/month, they are unpaid for current month.
    // However, "unpaid for this specific month" implies we check if they paid for this month?
    // The typical logic: "Paid up to".
    // If we want count of people who haven't paid strictly for this month:
    // It's hard to query "doesn't have a payment in this month" directly efficiently without raw SQL or retrieving all.
    // But using `lastFeePaidMonth` field on Student is easier if it's maintained.
    // Let's assume `lastFeePaidMonth` stores the date corresponding to the month they paid for.
    // So if selected month is Nov 2025, and lastFeePaidMonth is Oct 2025, they are unpaid.
    // Date comparison: lastFeePaidMonth < startOfMonth

    const studentsForUnpaidCheck = await prisma.student.findMany({
      where: {
        isActive: true,
        admissionStatus: 'COMPLETED',
        joinedAt: { lte: endOfMonth }
      },
      select: {
          id: true,
          lastFeePaidMonth: true,
          feePayments: {
              where: {
                  paidMonths: { has: targetMonthStr }
              },
              take: 1
          }
      }
    });
    console.log(studentsForUnpaidCheck, "studentsForUnpaidCheck");

    const unpaidCount = studentsForUnpaidCheck.filter(s => {
        if (s.feePayments.length > 0) return false;
        if (s.lastFeePaidMonth && s.lastFeePaidMonth >= startOfMonth) return false;
        return true;
    }).length;
    console.log(unpaidCount, "unpaidCount");

    // Collection Percentage?
    // Expected fee = sum of monthlyFees of all active students
    const expectedFeeAgg = await prisma.student.aggregate({
      _sum: {
        monthlyFees: true,
      },
      where: { isActive: true, admissionStatus: 'COMPLETED' },
    });
    const expectedFee = expectedFeeAgg._sum.monthlyFees || 0;

    // Avoid division by zero
    const collectionPercentage =
      expectedFee > 0 ? Math.round((collectedFee / expectedFee) * 100) : 0;

    return NextResponse.json({
      totalStudents,
      hafizCount,
      nazeraCount,
      newAdmissionsCount,
      collectedFee,
      unpaidCount,
      collectionPercentage,
      expectedFee,
      teacherCount,
      timeSlotsCount,
      classCount,
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview' },
      { status: 500 }
    );
  }
}
