import { fetchStudentsForExport } from '@/modules/students-export/students-export.repository';
import { getCache, setCache } from '@/lib/cache/cache';

const STUDENTS_EXPORT_CACHE_KEY = 'students_export:csv';
const STUDENTS_EXPORT_CACHE_TTL_SECONDS = 30;

export async function generateStudentsCsv() {
  const cachedCsv = await getCache(STUDENTS_EXPORT_CACHE_KEY);
  if (cachedCsv) {
    return cachedCsv;
  }

  const students = await fetchStudentsForExport();

  const headers = [
    'ID',
    'Name',
    'Father Name',
    'Gender',
    'Mobile',
    'Class',
    'Time Slot',
    'Fees',
  ];

  const rows = students.map((student) => [
    student.id,
    student.studentName,
    student.fatherName,
    student.gender || '',
    student.mobile,
    student.classSession?.classLevel?.name || 'Unassigned',
    student.classSession?.timeSlot?.label || '',
    student.monthlyFees,
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.map((item) => `"${item}"`).join(','))].join('\n');
  await setCache(STUDENTS_EXPORT_CACHE_KEY, csv, STUDENTS_EXPORT_CACHE_TTL_SECONDS);
  return csv;
}
