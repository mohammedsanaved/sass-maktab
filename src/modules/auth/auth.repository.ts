import prisma from '@/lib/prisma';

export function findAdminByEmail(email: string) {
  return prisma.admin.findUnique({
    where: { email },
    select: { id: true },
  });
}

export function createAdmin(data: { email: string; password: string; name: string }) {
  return prisma.admin.create({
    data: {
      email: data.email,
      password: data.password,
      name: data.name,
      role: 'ADMIN',
    },
    select: { id: true },
  });
}

export function findTeacherByEmail(email: string) {
  return prisma.teacher.findUnique({
    where: { email },
    select: { id: true },
  });
}

export function createTeacher(data: {
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
}) {
  return prisma.teacher.create({
    data: {
      email: data.email,
      password: data.password,
      name: data.name,
      phone: data.phone,
      address: data.address,
      role: 'TEACHER',
    },
    select: { id: true },
  });
}
