import React, { useState, useEffect } from 'react';
import { Card, Button, TableContainer, TableHead, TableRow, TableHeaderCell, TableCell, Modal, TextField } from '../../components/ui';
import { timeSlots as initialTimeSlots } from '../../services/mockData';
import { TimeSlot } from '../../types';
import { Edit, Trash2, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ManageTimeSlots = () => {
  const navigate = useNavigate();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  // Form State
  const [label, setLabel] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Load data on mount
  useEffect(() => {
    const saved = localStorage.getItem('settings_timeslots');
    if (saved) {
      setTimeSlots(JSON.parse(saved));
    } else {
      setTimeSlots(initialTimeSlots);
    }
  }, []);

  // Save data on change
  useEffect(() => {
    if (timeSlots.length > 0) {
      localStorage.setItem('settings_timeslots', JSON.stringify(timeSlots));
    }
  }, [timeSlots]);

  const handleOpenModal = (slot?: TimeSlot) => {
    if (slot) {
      setEditingSlot(slot);
      setLabel(slot.label);
      setStartTime(slot.startTime);
      setEndTime(slot.endTime);
    } else {
      setEditingSlot(null);
      setLabel('');
      setStartTime('');
      setEndTime('');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingSlot) {
      // Update
      setTimeSlots(prev => prev.map(t => t.id === editingSlot.id ? { ...t, label, startTime, endTime } : t));
    } else {
      // Create
      const newSlot: TimeSlot = {
        id: Math.random().toString(36).substr(2, 9),
        label,
        startTime,
        endTime
      };
      setTimeSlots(prev => [...prev, newSlot]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this time slot?')) {
      setTimeSlots(prev => prev.filter(t => t.id !== id));
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
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Time Slots</h2>
                <p className="text-gray-500 text-sm">Define the schedule blocks for classes.</p>
            </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end">
            <Button onClick={() => handleOpenModal()}>
                <Plus size={16} className="mr-2" /> Add Time Slot
            </Button>
        </div>
        <TableContainer className="border-none shadow-none rounded-none">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Label</TableHeaderCell>
              <TableHeaderCell>Start Time</TableHeaderCell>
              <TableHeaderCell>End Time</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {timeSlots.map((slot) => (
              <TableRow key={slot.id}>
                <TableCell><span className="font-medium">{slot.label}</span></TableCell>
                <TableCell>{slot.startTime}</TableCell>
                <TableCell>{slot.endTime}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="text" size="sm" onClick={() => handleOpenModal(slot)}>
                        <Edit size={16} className="text-blue-600" />
                    </Button>
                    <Button variant="text" size="sm" onClick={() => handleDelete(slot.id)}>
                        <Trash2 size={16} className="text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {timeSlots.length === 0 && (
                <TableRow>
                    <TableCell className="text-center py-6 text-gray-500">No time slots defined.</TableCell>
                </TableRow>
            )}
          </tbody>
        </TableContainer>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
        actions={
            <>
                <Button onClick={handleSave}>Save</Button>
                <Button variant="text" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            </>
        }
      >
        <div className="space-y-4">
            <TextField label="Label (e.g. Morning A)" value={label} onChange={e => setLabel(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
                <TextField label="Start Time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                <TextField label="End Time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
        </div>
      </Modal>
    </div>
  );
};