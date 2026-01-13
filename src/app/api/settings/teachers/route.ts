import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { hashPassword } from '@/lib/auth/password';

export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, address } = body;
    
    // Basic validation
    if (!name || !email || !password || !phone || !address) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const newTeacher = await prisma.teacher.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        role: 'TEACHER',
      },
    });
    
    return NextResponse.json(newTeacher, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, password, phone, address } = body;

    if (!id) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 });
    }

    const updateData: any = {
      name,
      email,
      phone,
      address,
    };

    if (password) {
      updateData.password = await hashPassword(password);
    }

    const updatedTeacher = await prisma.teacher.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedTeacher);
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 });
  }
}
