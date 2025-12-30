import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
// import { Role } from '@prisma/client';

export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Remove detailed password info from response if needed, for now returning all
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

    const newTeacher = await prisma.teacher.create({
      data: {
        name,
        email,
        password, // In a real app, hash this!
        phone,
        address,
        role: 'TEACHER',
      },
    });
    console.log('New teacher created:', newTeacher);
    return NextResponse.json(newTeacher, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 });
  }
}
