import prisma from '@/lib/prisma';

export interface DashboardOverviewEntity {
  totalStudents: number;
  hafizCount: number;
  nazeraCount: number;
  newAdmissionsCount: number;
  collectedFee: number;
  unpaidCount: number;
  collectionPercentage: number;
  expectedFee: number;
  teacherCount: number;
  timeSlotsCount: number;
  classCount: number;
}

export async function fetchDashboardOverview(
  year: number,
  month: number
): Promise<DashboardOverviewEntity> {
  const totalStudents = await prisma.student.count({
    where: { isActive: true, admissionStatus: 'COMPLETED' },
  });

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

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const newAdmissionsCount = await prisma.student.count({
    where: {
      joinedAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      admissionStatus: 'COMPLETED',
    },
  });

  const targetMonthStr = `${year}-${(month + 1).toString().padStart(2, '0')}`;

  const payments = await prisma.feePayment.findMany({
    where: {
      OR: [
        { paidMonths: { has: targetMonthStr } },
        {
          AND: [
            { paymentType: { not: 'MONTHLY' } },
            { paymentDate: { gte: startOfMonth, lte: endOfMonth } },
          ],
        },
        {
          AND: [
            { paidMonths: { isEmpty: true } },
            { paymentType: 'MONTHLY' },
            { paymentDate: { gte: startOfMonth, lte: endOfMonth } },
          ],
        },
      ],
    },
  });

  let collectedFee = 0;
  payments.forEach((payment) => {
    if (
      payment.paymentType === 'MONTHLY' &&
      payment.paidMonths &&
      payment.paidMonths.length > 0
    ) {
      if (payment.paidMonths.includes(targetMonthStr)) {
        collectedFee += payment.amount / payment.paidMonths.length;
      }
      return;
    }
    collectedFee += payment.amount;
  });

  const studentsForUnpaidCheck = await prisma.student.findMany({
    where: {
      isActive: true,
      admissionStatus: 'COMPLETED',
      joinedAt: { lte: endOfMonth },
    },
    select: {
      id: true,
      lastFeePaidMonth: true,
      feePayments: {
        where: {
          paidMonths: { has: targetMonthStr },
        },
        take: 1,
      },
    },
  });

  const unpaidCount = studentsForUnpaidCheck.filter((student) => {
    if (student.feePayments.length > 0) return false;
    if (student.lastFeePaidMonth && student.lastFeePaidMonth >= startOfMonth) return false;
    return true;
  }).length;

  const expectedFeeAgg = await prisma.student.aggregate({
    _sum: {
      monthlyFees: true,
    },
    where: { isActive: true, admissionStatus: 'COMPLETED' },
  });

  const expectedFee = expectedFeeAgg._sum.monthlyFees || 0;
  const collectionPercentage =
    expectedFee > 0 ? Math.round((collectedFee / expectedFee) * 100) : 0;

  return {
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
  };
}
