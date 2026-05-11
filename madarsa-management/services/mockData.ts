import { 
  Student, 
  Teacher, 
  ClassLevel, 
  ClassSession, 
  TimeSlot, 
  StudyStatus, 
  StudentType, 
  AdmissionStatus, 
  StudentStatus,
  DashboardStats
} from '../types';

// --- Generators ---
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Mock Data ---

export const classLevels: ClassLevel[] = [
  { id: 'cl1', name: 'Nursery 1', description: 'Beginner Level' },
  { id: 'cl2', name: 'Nursery 2', description: 'Intermediate Level' },
  { id: 'cl3', name: 'Deniyaat 1', description: 'Advanced Level' },
  { id: 'cl4', name: 'Hifz Class', description: 'Memorization' },
];

export const timeSlots: TimeSlot[] = [
  { id: 'ts1', label: 'Morning A', startTime: '07:30', endTime: '09:00' },
  { id: 'ts2', label: 'Morning B', startTime: '09:00', endTime: '10:30' },
  { id: 'ts3', label: 'Evening A', startTime: '16:00', endTime: '17:30' },
];

export const teachers: Teacher[] = [
  { id: 't1', name: 'Moulana Ahmed', email: 'ahmed@salah.com', phone: '1234567890', role: 'TEACHER' as any },
  { id: 't2', name: 'Ustadha Fatima', email: 'fatima@salah.com', phone: '0987654321', role: 'TEACHER' as any },
  { id: 't3', name: 'Qari Bilal', email: 'bilal@salah.com', phone: '1122334455', role: 'TEACHER' as any },
];

export const classSessions: ClassSession[] = [
  { 
    id: 'cs1', 
    teacherId: 't1', 
    classLevelId: 'cl3', 
    timeSlotId: 'ts1', 
    sectionName: 'Boys A', 
    maxStudents: 30,
    teacherName: 'Moulana Ahmed',
    classLevelName: 'Deniyaat 1',
    timeSlotLabel: 'Morning A'
  },
  { 
    id: 'cs2', 
    teacherId: 't2', 
    classLevelId: 'cl1', 
    timeSlotId: 'ts2', 
    sectionName: 'Girls A', 
    maxStudents: 25,
    teacherName: 'Ustadha Fatima',
    classLevelName: 'Nursery 1',
    timeSlotLabel: 'Morning B'
  },
  { 
    id: 'cs3', 
    teacherId: 't3', 
    classLevelId: 'cl4', 
    timeSlotId: 'ts1', 
    sectionName: 'Hifz Boys', 
    maxStudents: 15,
    teacherName: 'Qari Bilal',
    classLevelName: 'Hifz Class',
    timeSlotLabel: 'Morning A'
  },
  { 
    id: 'cs4', 
    teacherId: 't3', 
    classLevelId: 'cl4', 
    timeSlotId: 'ts3', 
    sectionName: 'Hifz Evening', 
    maxStudents: 15,
    teacherName: 'Qari Bilal',
    classLevelName: 'Hifz Class',
    timeSlotLabel: 'Evening A'
  },
];

// Helper to create students
const createStudents = (count: number): Student[] => {
  const students: Student[] = [];
  const names = ['Abdullah', 'Ayesha', 'Mohammed', 'Zainab', 'Omar', 'Fatima', 'Ali', 'Mariam', 'Yusuf', 'Sara', 'Ibrahim', 'Khadija', 'Hassan', 'Hafsa', 'Bilal'];
  
  for (let i = 0; i < count; i++) {
    const statusRand = Math.random();
    const studyStatus = statusRand > 0.8 ? StudyStatus.IRREGULAR : (statusRand > 0.9 ? StudyStatus.COMPLETED : StudyStatus.REGULAR);
    const session = classSessions[Math.floor(Math.random() * classSessions.length)];
    
    // Generate Random Admission Status for Dashboard Demo
    let admissionStatus = AdmissionStatus.COMPLETED;
    const admissionRand = Math.random();
    if (admissionRand > 0.85) admissionStatus = AdmissionStatus.PENDING;
    else if (admissionRand > 0.75) admissionStatus = AdmissionStatus.IN_PROGRESS;

    // Generate Random Admission Date (2023 - 2025)
    const year = 2023 + Math.floor(Math.random() * 3);
    const month = 1 + Math.floor(Math.random() * 12);
    const day = 1 + Math.floor(Math.random() * 28);
    const admissionDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    students.push({
      id: generateId(),
      rollNumber: `R-${1000 + i}`,
      studentName: `${names[i % names.length]} ${names[(i + 2) % names.length]}`,
      fatherName: `Father of ${names[i % names.length]}`,
      mobile: `+92 300 12345${i}`,
      type: i % 3 === 0 ? StudentType.HAFIZ : StudentType.NAZERA,
      admissionStatus: admissionStatus,
      status: StudentStatus.OLD,
      studyStatus: studyStatus,
      classSessionId: session.id,
      classSession: session,
      monthlyFees: 2000,
      lastFeePaidMonth: Math.random() > 0.3 ? new Date().toISOString() : undefined, // 30% haven't paid this month
      admissionDate: admissionDate
    });
  }
  return students;
};

export const studentsData = createStudents(65); // increased count for better charts

export const getStats = (): DashboardStats => {
  const total = studentsData.length;
  const regular = studentsData.filter(s => s.studyStatus === StudyStatus.REGULAR).length;
  const irregular = studentsData.filter(s => s.studyStatus === StudyStatus.IRREGULAR).length;
  const completed = studentsData.filter(s => s.studyStatus === StudyStatus.COMPLETED).length;
  
  // Logic: Calculate fees
  // Assuming current month is the target.
  const paidStudents = studentsData.filter(s => !!s.lastFeePaidMonth);
  const feesCollected = paidStudents.reduce((acc, s) => acc + s.monthlyFees, 0);
  const totalExpectedFees = studentsData.reduce((acc, s) => acc + s.monthlyFees, 0);

  return {
    totalStudents: total,
    regularStudents: regular,
    irregularStudents: irregular,
    completedStudents: completed,
    feesCollected,
    totalExpectedFees
  };
};

export const getFinancialHistory = (year: number) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  // Deterministic random generator based on year to keep charts stable but different per year
  const baseRevenue = year === 2024 ? 45000 : (year === 2025 ? 55000 : 35000);
  const growthFactor = year === 2024 ? 1000 : 1500;

  return months.map((m, index) => {
    // Add some "randomness" that is consistent for the same inputs
    const randomVar = Math.sin(index * year) * 5000; 
    const revenue = baseRevenue + (index * growthFactor) + randomVar;
    const expenses = revenue * 0.6; // 60% expenses
    
    return {
      name: m,
      revenue: Math.abs(Math.round(revenue)),
      expenses: Math.abs(Math.round(expenses))
    };
  });
};

export const getTimeSlotStats = () => {
  return timeSlots.map(slot => {
    // Find sessions in this time slot
    const sessionsInSlot = classSessions.filter(cs => cs.timeSlotId === slot.id);
    
    // Base object
    const result: any = {
      name: slot.label,
      activeClasses: sessionsInSlot.length
    };

    // Aggregate students per class level within this slot
    classLevels.forEach(level => {
      // Find session for this level in this slot
      const session = sessionsInSlot.find(s => s.classLevelId === level.id);
      if (session) {
        // Count students in this session
        const count = studentsData.filter(s => s.classSessionId === session.id).length;
        result[level.name] = count;
      } else {
        result[level.name] = 0;
      }
    });

    return result;
  });
};