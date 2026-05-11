import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role, name, phone, address } = body;
    console.log('Registration request body:', body);

    if (!email || !password || !role || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    if (role === 'ADMIN') {
      const existingAdmin = await prisma.admin.findUnique({
        where: { email },
      });

      if (existingAdmin) {
        return NextResponse.json(
          { error: 'Admin with this email already exists' },
          { status: 409 }
        );
      }

      const newAdmin = await prisma.admin.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'ADMIN',
        },
      });
      console.log('New admin created:', newAdmin);

      return NextResponse.json(
        { message: 'Admin registered successfully', userId: newAdmin.id },
        { status: 201 }
      );
    } else if (role === 'TEACHER') {
      if (!phone || !address) {
        return NextResponse.json(
          { error: 'Phone and address are required for teachers' },
          { status: 400 }
        );
      }

      const existingTeacher = await prisma.teacher.findUnique({
        where: { email },
      });

      if (existingTeacher) {
        return NextResponse.json(
          { error: 'Teacher with this email already exists' },
          { status: 409 }
        );
      }

      const newTeacher = await prisma.teacher.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          address,
          role: 'TEACHER',
        },
      });

      return NextResponse.json(
        { message: 'Teacher registered successfully', userId: newTeacher.id },
        { status: 201 }
      );
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
