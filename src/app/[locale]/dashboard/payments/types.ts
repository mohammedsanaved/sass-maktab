export interface StudentPaymentInfo {
  id: string;
  feeCategory: string;
  rollNumber: string;
  studentName: string;
  fatherName: string;
  mobile: string;
  monthlyFees: number;
  lastFeePaidMonth: string | null;
  joinedAt: string;
  arrears: {
    months: number;
    amount: number;
  };
  latestPayment: {
    paymentDate: string;
    amount: number;
    paidMonths: string[];
    remarks: string | null;
  } | null;
  classSession: {
    classLevelName: string;
  } | null;
}

export interface ClassLevel {
  id: string;
  name: string;
}

export interface TimeSlot {
  id: string;
  label: string;
}

export interface ClassSession {
  id: string;
  classLevel: { name: string };
  timeSlot: { label: string };
  teacher: { name: string };
}
