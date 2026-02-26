import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/server/api-utils';
import {
  createTeacher,
  listTeachers,
  updateTeacherById,
} from '@/modules/teachers/teachers.service';
import { parseBody } from '@/lib/server/validation';

const createTeacherSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().trim().min(1),
  address: z.string().trim().min(1),
});

const updateTeacherSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  phone: z.string().trim().min(1).optional(),
  address: z.string().trim().min(1).optional(),
});

export async function GET() {
  try {
    const teachers = await listTeachers();
    return NextResponse.json(teachers);
  } catch (error) {
    return handleApiError(error, 'Error fetching teachers');
  }
}

export async function POST(request: Request) {
  try {
    const payload = await parseBody(request, createTeacherSchema);

    const newTeacher = await createTeacher({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      phone: payload.phone,
      address: payload.address,
    });

    return NextResponse.json(newTeacher, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Error creating teacher');
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await parseBody(request, updateTeacherSchema);

    const updatedTeacher = await updateTeacherById(payload.id, {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      phone: payload.phone,
      address: payload.address,
    });

    return NextResponse.json(updatedTeacher);
  } catch (error) {
    return handleApiError(error, 'Error updating teacher');
  }
}
