import React, { useState, useEffect } from 'react';
import { Card, Button, TableContainer, TableHead, TableRow, TableHeaderCell, TableCell, Modal, TextField, Badge } from '../../components/ui';
import { teachers as initialTeachers } from '../../services/mockData';
import { Teacher, Role } from '../../types';
import { Edit, Trash2, ArrowLeft, Plus, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ManageTeachers = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('settings_teachers');
    if (saved) {
      setTeachers(JSON.parse(saved));
    } else {
      setTeachers(initialTeachers);
    }
  }, []);

  useEffect(() => {
    if (teachers.length > 0) {
      localStorage.setItem('settings_teachers', JSON.stringify(teachers));
    }
  }, [teachers]);

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

  const handleSave = () => {
    if (editingTeacher) {
      setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? { ...t, name, email, phone } : t));
    } else {
      const newTeacher: Teacher = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        phone,
        role: Role.TEACHER
      };
      setTeachers(prev => [...prev, newTeacher]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      setTeachers(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button variant="outlined" size="sm" onClick={() => navigate('/settings')}>
                <ArrowLeft size={16} />
            </Button>
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Teachers</h2>
                <p className="text-gray-500 text-sm">Add or edit teacher profiles.</p>
            </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end">
            <Button onClick={() => handleOpenModal()}>
                <Plus size={16} className="mr-2" /> Add Teacher
            </Button>
        </div>
        <TableContainer className="border-none shadow-none rounded-none">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Contact</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{teacher.name}</div>
                </TableCell>
                <TableCell>
                    <div className="flex flex-col space-y-1">
                        <span className="flex items-center text-xs text-gray-500">
                            <Mail size={12} className="mr-1" /> {teacher.email}
                        </span>
                        <span className="flex items-center text-xs text-gray-500">
                            <Phone size={12} className="mr-1" /> {teacher.phone}
                        </span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge color="blue">{teacher.role}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="text" size="sm" onClick={() => handleOpenModal(teacher)}>
                        <Edit size={16} className="text-blue-600" />
                    </Button>
                    <Button variant="text" size="sm" onClick={() => handleDelete(teacher.id)}>
                        <Trash2 size={16} className="text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
             {teachers.length === 0 && (
                <TableRow>
                    <TableCell className="text-center py-6 text-gray-500">No teachers found.</TableCell>
                </TableRow>
            )}
          </tbody>
        </TableContainer>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
        actions={
            <>
                <Button onClick={handleSave}>Save</Button>
                <Button variant="text" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            </>
        }
      >
        <div className="space-y-4">
            <TextField label="Full Name" value={name} onChange={e => setName(e.target.value)} />
            <TextField label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <TextField label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
};