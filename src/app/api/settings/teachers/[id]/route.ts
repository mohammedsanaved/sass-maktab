import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiError, handleApiError } from '@/lib/server/api-utils';
import {
  deleteTeacherById,
  getTeacherById,
  updateTeacherById,
} from '@/modules/teachers/teachers.service';
import { parseBody, parseParams } from '@/lib/server/validation';

const routeParamsSchema = z.object({
  id: z.string().min(1),
});

const updateTeacherSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  phone: z.string().trim().min(1).optional(),
  address: z.string().trim().min(1).optional(),
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await parseParams(params, routeParamsSchema);
    const teacher = await getTeacherById(id);
    if (!teacher) {
      throw new ApiError(404, 'Teacher not found');
    }
    return NextResponse.json(teacher);
  } catch (error) {
    return handleApiError(error, 'Error fetching teacher');
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await parseParams(params, routeParamsSchema);
    const payload = await parseBody(request, updateTeacherSchema);

    const updatedTeacher = await updateTeacherById(id, {
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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await parseParams(params, routeParamsSchema);
    await deleteTeacherById(id);
    return NextResponse.json({ message: 'Teacher deleted successfully', id });
  } catch (error) {
    return handleApiError(error, 'Error deleting teacher');
  }
}
