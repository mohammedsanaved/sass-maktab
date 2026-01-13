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

export enum HafizCategory {
  FULL_TIME = 'FULL_TIME',
  HALF_TIME = 'HALF_TIME'
}

export enum FullTimeSubCategory {
  HAFIZ_SCHOOL = 'HAFIZ_SCHOOL',
  BASICS = 'BASICS',
  FULL_COURSE = 'FULL_COURSE'
}

export interface ClassLevel {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeSlot {
  id: string;
  label: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassSession {
  id: string;
  teacherId?: string;
  classLevelId: string;
  timeSlotId: string;
  sectionName?: string;
  maxStudents?: number;
  teacher?: { name: string };
  classLevel?: ClassLevel;
  timeSlot?: TimeSlot;
  classLevelName?: string; // Optional helper for UI
  timeSlotLabel?: string;  // Optional helper for UI
  sectionNameStr?: string; // Optional helper for UI
}

export interface Student {
  id: string;
  // Personal
  studentName: string;
  fatherName: string;
  gender?: 'M' | 'F' | string;
  dateOfBirth?: string;
  age?: number;
  mobile: string;
  mobileOther?: string;
  residence?: string;
  fullPermanentAddress?: string;
  
  // Identifiers
  formNo?: string;
  grNumber?: string;
  rollNumber: string;
  
  // Academic
  type: StudentType;
  hafizCategory?: HafizCategory | string;
  fullTimeSubCategory?: FullTimeSubCategory | string;
  previousTraining?: string;
  previousSchool?: string;
  
  // Status
  admissionStatus: AdmissionStatus;
  status: StudentStatus;
  studyStatus: StudyStatus;
  isActive: boolean;
  joinedAt: string;
  
  // Financial
  admissionFee?: number;
  monthlyFees: number;
  lastFeePaidMonth?: string;
  
  // Class Assignment
  classSessionId?: string;
  classSession?: ClassSession;
  
  // Meta
  remarks?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactName2?: string;
  emergencyContactPhone2?: string;
  
  parentGuardianOccupation?: string;
  academicYear?: string; // Current/Active enrollment year
  arrears?: {
    months: number;
    amount: number;
  };
}

export interface Teacher {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
}

export interface TeacherWithDetails extends Teacher {
    classSessions: ClassSession[];
    classes: {
        classLevel: ClassLevel;
        timeSlots: TimeSlot[];
        totalStudents: number;
        sessions: {
            id: string;
            sectionName: string;
            timeSlot: TimeSlot;
        }[];
    }[];
}
