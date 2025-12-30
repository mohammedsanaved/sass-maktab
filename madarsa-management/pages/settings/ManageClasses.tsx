import React, { useState, useEffect } from 'react';
import { Card, Button, TableContainer, TableHead, TableRow, TableHeaderCell, TableCell, Modal, TextField } from '../../components/ui';
import { classLevels as initialClasses } from '../../services/mockData';
import { ClassLevel } from '../../types';
import { Edit, Trash2, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ManageClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassLevel | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('settings_classes');
    if (saved) {
      setClasses(JSON.parse(saved));
    } else {
      setClasses(initialClasses);
    }
  }, []);

  useEffect(() => {
    if (classes.length > 0) {
      localStorage.setItem('settings_classes', JSON.stringify(classes));
    }
  }, [classes]);

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

  const handleSave = () => {
    if (editingClass) {
      setClasses(prev => prev.map(c => c.id === editingClass.id ? { ...c, name, description } : c));
    } else {
      const newClass: ClassLevel = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        description
      };
      setClasses(prev => [...prev, newClass]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this class? This might affect existing student records.')) {
      setClasses(prev => prev.filter(c => c.id !== id));
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
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Classes</h2>
                <p className="text-gray-500 text-sm">Create and update class levels.</p>
            </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end">
            <Button onClick={() => handleOpenModal()}>
                <Plus size={16} className="mr-2" /> Add Class
            </Button>
        </div>
        <TableContainer className="border-none shadow-none rounded-none">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Class Name</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {classes.map((cls) => (
              <TableRow key={cls.id}>
                <TableCell><span className="font-medium">{cls.name}</span></TableCell>
                <TableCell>{cls.description || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="text" size="sm" onClick={() => handleOpenModal(cls)}>
                        <Edit size={16} className="text-blue-600" />
                    </Button>
                    <Button variant="text" size="sm" onClick={() => handleDelete(cls.id)}>
                        <Trash2 size={16} className="text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
             {classes.length === 0 && (
                <TableRow>
                    <TableCell className="text-center py-6 text-gray-500">No classes found.</TableCell>
                </TableRow>
            )}
          </tbody>
        </TableContainer>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Edit Class' : 'Add New Class'}
        actions={
            <>
                <Button onClick={handleSave}>Save</Button>
                <Button variant="text" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            </>
        }
      >
        <div className="space-y-4">
            <TextField label="Class Name" value={name} onChange={e => setName(e.target.value)} />
            <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
};