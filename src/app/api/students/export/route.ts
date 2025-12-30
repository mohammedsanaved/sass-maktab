import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(request: Request) {
  try {
      // Middleware ensures only Auth users access this
      const students = await prisma.student.findMany({
          include: {
              classSession: {
                  include: {
                      classLevel: true,
                      timeSlot: true
                  }
              }
          },
          orderBy: { studentName: 'asc' }
      });

      // Simple CSV generation
      const headers = ['ID', 'Name', 'Father Name', 'Gender', 'Mobile', 'Class', 'Time Slot', 'Fees'];
      const rows = students.map(s => [
          s.id,
          s.studentName,
          s.fatherName,
          (s as any).gender || '',
          s.mobile,
          s.classSession?.classLevel?.name || 'Unassigned',
          s.classSession?.timeSlot?.label || '',
          s.monthlyFees
      ]);

      const csvContent = [
          headers.join(','),
          ...rows.map(r => r.map(c => `"${c}"`).join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
          headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="students.csv"'
          }
      });

  } catch (error) {
    console.error('Error exporting students:', error);
    return NextResponse.json({ error: 'Failed to export students' }, { status: 500 });
  }
}
