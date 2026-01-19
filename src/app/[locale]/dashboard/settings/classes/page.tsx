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
  TableBody,
} from '@/components/ui';
import { Edit, Trash2, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface ClassLevel {
  id: string;
  name: string;
  description?: string;
}

export default function ManageClasses() {
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      try {
        const response = await apiFetch('/api/settings/classes');
        if (!response.ok) throw new Error('Failed to fetch classes');
        const data = await response.json();
        setClasses(data);
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const handleOpenModal = (cls?: ClassLevel) => {
    if (cls) {
      setEditingClass(cls);
      setName(cls.name);
      setDescription(cls.description || '');
    } else {
      setEditingClass(null);
      setName('');
      setDescription('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const classData = { name, description };
    try {
      let response;
      if (editingClass) {
        response = await apiFetch(`/api/settings/classes/${editingClass.id}`, {
          method: 'PUT',
          body: JSON.stringify(classData),
        });
      } else {
        response = await apiFetch(`/api/settings/classes`, {
          method: 'POST',
          body: JSON.stringify(classData),
        });
      }

      if (!response.ok) throw new Error('Failed to save class');
      const updatedClasses = await (
        await apiFetch('/api/settings/classes')
      ).json();
      setClasses(updatedClasses);
    } catch (error) {
      console.error(error);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this class? This might affect existing student records.'
      )
    ) {
      try {
        const response = await apiFetch(`/api/settings/classes/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete class');
        setClasses((prev) => prev.filter((c) => c.id !== id));
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
          <h2 className='text-2xl font-bold text-foreground'>Manage Classes</h2>
          <p className='text-gray-500 text-sm'>
            Create and update class levels.
          </p>
        </div>
      </div>

      <Card className='p-0 overflow-hidden'>
        <div className='p-4 border-none flex justify-end'>
          <Button
            onClick={() => handleOpenModal()}
            startIcon={<Plus size={16} />}
            variant='contained'
          >
            {' '}
            Add Class
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-primary-500" size={40} />
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <Th>Class Name</Th>
                <Th>Description</Th>
                <Th>Actions</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {classes.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell>
                    <span className='font-medium'>{cls.name}</span>
                  </TableCell>
                  <TableCell>{cls.description || '-'}</TableCell>
                  <TableCell>
                    <div className='flex gap-2'>
                      <Button
                        variant='text'
                        size='sm'
                        onClick={() => handleOpenModal(cls)}
                      >
                        <Edit size={16} className='text-blue-600' />
                      </Button>
                      <Button
                        variant='text'
                        size='sm'
                        onClick={() => handleDelete(cls.id)}
                      >
                        <Trash2 size={16} className='text-red-600' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {classes.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className='text-center py-6 text-gray-500'
                  >
                    No classes found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Edit Class' : 'Add New Class'}
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
            label='Class Name'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label='Description'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
