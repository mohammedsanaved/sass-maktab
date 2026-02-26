import { hashPassword } from '@/lib/auth/password';
import { ApiError } from '@/lib/server/api-utils';
import {
  createAdmin,
  createTeacher,
  findAdminByEmail,
  findTeacherByEmail,
} from '@/modules/auth/auth.repository';

type RegisterRole = 'ADMIN' | 'TEACHER';

export interface RegisterUserInput {
  email: string;
  password: string;
  role: RegisterRole;
  name: string;
  phone?: string;
  address?: string;
}

export async function registerUser(input: RegisterUserInput) {
  const hashedPassword = await hashPassword(input.password);

  if (input.role === 'ADMIN') {
    const existingAdmin = await findAdminByEmail(input.email);

    if (existingAdmin) {
      throw new ApiError(409, 'Admin with this email already exists');
    }

    const newAdmin = await createAdmin({
      email: input.email,
      password: hashedPassword,
      name: input.name,
    });

    return { message: 'Admin registered successfully', userId: newAdmin.id };
  }

  if (!input.phone || !input.address) {
    throw new ApiError(400, 'Phone and address are required for teachers');
  }

  const existingTeacher = await findTeacherByEmail(input.email);

  if (existingTeacher) {
    throw new ApiError(409, 'Teacher with this email already exists');
  }

  const newTeacher = await createTeacher({
    email: input.email,
    password: hashedPassword,
    name: input.name,
    phone: input.phone,
    address: input.address,
  });

  return { message: 'Teacher registered successfully', userId: newTeacher.id };
}
