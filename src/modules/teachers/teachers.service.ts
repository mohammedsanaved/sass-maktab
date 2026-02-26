import { hashPassword } from '@/lib/auth/password';
import { teacherPublicSelect } from '@/modules/teachers/teachers.constants';
import {
  findManyTeachers,
  findTeacherById,
  insertTeacher,
  patchTeacher,
  removeTeacher,
} from '@/modules/teachers/teachers.repository';

export { teacherPublicSelect };

export interface CreateTeacherInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

export interface UpdateTeacherInput {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
}

export async function listTeachers() {
  return findManyTeachers();
}

export async function getTeacherById(id: string) {
  return findTeacherById(id);
}

export async function createTeacher(input: CreateTeacherInput) {
  const hashedPassword = await hashPassword(input.password);

  return insertTeacher({
    name: input.name,
    email: input.email,
    password: hashedPassword,
    phone: input.phone,
    address: input.address,
  });
}

export async function updateTeacherById(id: string, input: UpdateTeacherInput) {
  const data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    password?: string;
  } = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.email !== undefined) data.email = input.email;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.address !== undefined) data.address = input.address;
  if (input.password) {
    data.password = await hashPassword(input.password);
  }

  return patchTeacher(id, data);
}

export async function deleteTeacherById(id: string) {
  return removeTeacher(id);
}
