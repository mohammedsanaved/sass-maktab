
export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER'
}

export enum AdmissionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING'
}

export enum StudyStatus {
  REGULAR = 'REGULAR',
  IRREGULAR = 'IRREGULAR',
  COMPLETED = 'COMPLETED'
}

export enum StudentType {
  HAFIZ = 'HAFIZ',
  NAZERA = 'NAZERA'
}

export enum StudentStatus {
  NEW = 'NEW',
  OLD = 'OLD'
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
}

export interface ClassLevel {
  id: string;
  name: string;
  description?: string;
}

export interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

export interface ClassSession {
  id: string;
  teacherId: string;
  classLevelId: string;
  timeSlotId: string;
  sectionName?: string;
  maxStudents: number;
  teacherName?: string; 
  classLevelName?: string; 
  timeSlotLabel?: string; 
  studentCount?: number;
}

export interface Student {
  id: string;
  formNo?: string;
  grNo?: string;
  rollNumber: string;
  studentName: string;
  fatherName: string;
  dob?: string;
  age?: string;
  gender?: 'M' | 'F';
  address?: string;
  mobile: string;
  mobileOther?: string;
  previousSchool?: string;
  previousStandard?: string;
  parentProfession?: string;
  emergencyContact1?: string;
  emergencyContact2?: string;
  type: StudentType;
  admissionStatus: AdmissionStatus;
  status: StudentStatus;
  studyStatus: StudyStatus;
  classSessionId?: string;
  classSession?: ClassSession; 
  admissionFee?: number;
  monthlyFees: number;
  receiptNo?: string;
  lastFeePaidMonth?: string; 
  admissionDate?: string; 
  remarks?: string;
}

export interface FeePayment {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  paymentType: "ADMISSION" | "MONTHLY" | "DONATION";
  remarks?: string;
}

export interface DashboardStats {
  totalStudents: number;
  regularStudents: number;
  irregularStudents: number;
  completedStudents: number;
  feesCollected: number;
  totalExpectedFees: number;
}
