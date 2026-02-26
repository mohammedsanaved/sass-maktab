// Shared utilities for fee and arrears calculation to ensure consistency across the application.

export interface ArrearsResult {
  months: number;
  amount: number;
  unpaidMonths: string[];
}

/**
 * Calculates arrears for a student based on their join date and payment history.
 * Current month is NOT considered an arrear.
 * 
 * @param student - Student object with feeCategory and monthlyFees
 * @param payments - List of fee payments with paidMonths
 * @param referenceDate - The date to calculate arrears up to (defaults to start of current month)
 * @returns ArrearsResult containing months count, total amount, and list of unpaid month strings (YYYY-MM)
 */
export function calculateStudentArrears(
  student: { joinedAt: Date; feeCategory: string; monthlyFees: number },
  payments: { paidMonths: string[] | any }[],
  referenceDate: Date = new Date()
): ArrearsResult {
  // Normalize reference date to the start of the current month
  const normalizedRef = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  normalizedRef.setHours(0, 0, 0, 0);

  let arrearsMonths = 0;
  let arrearsAmount = 0;
  const unpaidMonths: string[] = [];

  // Skip calculation for free categories
  const paysFee = student.feeCategory === 'REGULAR' || student.feeCategory === 'SPONSORED';
  if (!paysFee || student.monthlyFees <= 0) {
    return { months: 0, amount: 0, unpaidMonths: [] };
  }

  const joinDate = new Date(student.joinedAt);
  const startCalculationFrom = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);

  // Collect all paid months across all transactions
  const allPaidMonths = new Set<string>();
  payments.forEach((p) => {
    if (p.paidMonths && Array.isArray(p.paidMonths)) {
      p.paidMonths.forEach((m: string) => allPaidMonths.add(m));
    }
  });

  // Loop from join date to (but not including) referenceDate
  const tempDate = new Date(startCalculationFrom);
  while (tempDate < normalizedRef) {
    const monthStr = tempDate.toISOString().substring(0, 7);
    if (!allPaidMonths.has(monthStr)) {
      arrearsMonths++;
      arrearsAmount += student.monthlyFees;
      unpaidMonths.push(monthStr);
    }
    tempDate.setMonth(tempDate.getMonth() + 1);
  }

  return {
    months: arrearsMonths,
    amount: arrearsAmount,
    unpaidMonths,
  };
}
