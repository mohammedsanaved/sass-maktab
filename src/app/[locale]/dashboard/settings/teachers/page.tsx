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
import { Edit, Trash2, Plus, Phone, Mail } from 'lucide-react';

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

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    // Replace with API call
    const fetchTeachers = async () => {
      try {
        const response = await fetch('/api/teachers');
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
    } else {
      setEditingTeacher(null);
      setName('');
      setEmail('');
      setPhone('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const teacherData = { name, email, phone, role: 'TEACHER' };
    try {
      let response;
      if (editingTeacher) {
        response = await fetch(`/api/teachers`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTeacher.id, ...teacherData }),
        });
      } else {
        response = await fetch(`/api/teachers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(teacherData),
        });
      }

      if (!response.ok) throw new Error('Failed to save teacher');

      // Refresh teacher list
      const updatedTeachers = await (await fetch('/api/teachers')).json();
      setTeachers(updatedTeachers);
    } catch (error) {
      console.error(error);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        const response = await fetch(`/api/teachers`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
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
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-800 dark:text-white'>
            Manage Teachers
          </h2>
          <p className='text-gray-500 text-sm'>Add or edit teacher profiles.</p>
        </div>
      </div>

      <Card className='p-0 overflow-hidden'>
        <div className='p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end'>
          <Button
            onClick={() => handleOpenModal()}
            startIcon={<Plus size={16} />}
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
                  <div className='font-medium text-gray-900 dark:text-gray-100'>
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
        </div>
      </Modal>
    </div>
  );
}
