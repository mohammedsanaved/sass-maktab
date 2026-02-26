import prisma from '@/lib/prisma';
import { teacherPublicSelect } from '@/modules/teachers/teachers.constants';

export function findManyTeachers() {
  return prisma.teacher.findMany({
    orderBy: { createdAt: 'desc' },
    select: teacherPublicSelect,
  });
}

export function findTeacherById(id: string) {
  return prisma.teacher.findUnique({
    where: { id },
    select: teacherPublicSelect,
  });
}

export function insertTeacher(data: {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}) {
  return prisma.teacher.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      address: data.address,
      role: 'TEACHER',
    },
    select: teacherPublicSelect,
  });
}

export function patchTeacher(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    password?: string;
  }
) {
  return prisma.teacher.update({
    where: { id },
    data,
    select: teacherPublicSelect,
  });
}

export function removeTeacher(id: string) {
  return prisma.teacher.delete({
    where: { id },
    select: teacherPublicSelect,
  });
}
