import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
    });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }
    return NextResponse.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, email, phone, address } = body;

    const updatedTeacher = await prisma.teacher.update({
      where: { id: params.id },
      data: { name, email, phone, address },
    });
    return NextResponse.json(updatedTeacher);
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.teacher.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 });
  }
}
