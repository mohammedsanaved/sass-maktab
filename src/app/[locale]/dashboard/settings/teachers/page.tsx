'use client';
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  TableHead,
  TableRow,
  Th,
  TableCell,
  Modal,
  TextField,
  Badge,
  TableBody,
} from '@/components/ui';
import { Edit, Trash2, Plus, Phone, Mail, ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'TEACHER'; // Assuming a single role for now
}

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Replace with API call
    const fetchTeachers = async () => {
      try {
        const response = await apiFetch('/api/settings/teachers');
        if (!response.ok) throw new Error('Failed to fetch teachers');
        const data = await response.json();
        setTeachers(data);
      } catch (error) {
        console.error(error);
        // Handle error state in UI
      }
    };
    fetchTeachers();
  }, []);

  const handleOpenModal = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setName(teacher.name);
      setEmail(teacher.email);
      setPhone(teacher.phone);
      setAddress((teacher as any).address || ''); // Handle if address is not in type yet
      setPassword(''); // Don't show existing hash
    } else {
      setEditingTeacher(null);
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setPassword('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const teacherData: any = { name, email, phone, address, role: 'TEACHER' };
    if (password) {
      teacherData.password = password;
    }

    try {
      let response;
      if (editingTeacher) {
        response = await apiFetch(`/api/settings/teachers`, {
          method: 'PUT',
          body: JSON.stringify({ id: editingTeacher.id, ...teacherData }),
        });
      } else {
        // Validate password for new creation
        if (!password) {
            alert("Password is required for new teachers");
            return;
        }
        response = await apiFetch(`/api/settings/teachers`, {
          method: 'POST',
          body: JSON.stringify(teacherData),
        });
      }

      if (!response.ok) throw new Error('Failed to save teacher');

      // Refresh teacher list
      const updatedTeachers = await (await apiFetch('/api/settings/teachers')).json();
      setTeachers(updatedTeachers);
    } catch (error) {
      console.error(error);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        const response = await apiFetch(`/api/teachers`, {
          method: 'DELETE',
          body: JSON.stringify({ id }),
        });
        if (!response.ok) throw new Error('Failed to delete teacher');
        setTeachers((prev) => prev.filter((t) => t.id !== id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-start gap-2'>
        <Button variant="outlined" size="sm" onClick={() => router.push('/dashboard/settings')} className="p-2">
            <ArrowLeft size={20} />
          </Button>
        <div>
          <h2 className='text-2xl font-bold text-foreground'>
            Manage Teachers
          </h2>
          <p className='text-gray-500 text-sm'>Add or edit teacher profiles.</p>
        </div>
      </div>

      <Card className='p-0 overflow-hidden'>
        <div className='p-4 flex justify-end bg-background border-b border-primary-100'>
          <Button
            onClick={() => handleOpenModal()}
            startIcon={<Plus size={16} />}
            variant='text'
          >
            {' '}
            Add Teacher
          </Button>
        </div>
        <Table>
          <TableHead>
            <TableRow>
              <Th>Name</Th>
              <Th>Contact</Th>
              <Th>Role</Th>
              <Th>Actions</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell>
                  <div className='font-medium text-foreground'>
                    {teacher.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex flex-col space-y-1'>
                    <span className='flex items-center text-xs text-gray-500'>
                      <Mail size={12} className='mr-1' /> {teacher.email}
                    </span>
                    <span className='flex items-center text-xs text-gray-500'>
                      <Phone size={12} className='mr-1' /> {teacher.phone}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge color='blue'>{teacher.role}</Badge>
                </TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <Button
                      variant='text'
                      size='sm'
                      onClick={() => handleOpenModal(teacher)}
                    >
                      <Edit size={16} className='text-blue-600' />
                    </Button>
                    <Button
                      variant='text'
                      size='sm'
                      onClick={() => handleDelete(teacher.id)}
                    >
                      <Trash2 size={16} className='text-red-600' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {teachers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className='text-center py-6 text-gray-500'
                >
                  No teachers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
        actions={
          <div className='flex gap-2'>
            <Button onClick={handleSave}>Save</Button>
            <Button variant='text' onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        }
      >
        <div className='space-y-4'>
          <TextField
            label='Full Name'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label='Email Address'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label='Phone Number'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
           <TextField
            label='Address'
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
           <TextField
            label={editingTeacher ? 'Reset Password (optional)' : 'Password'}
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={editingTeacher ? 'Leave blank to keep current' : ''}
          />
        </div>
      </Modal>
    </div>
  );
}
