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
import { Edit, Trash2, Plus } from 'lucide-react';

interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

export default function ManageTimeSlots() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  // Form State
  const [label, setLabel] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Load data on mount
  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        const response = await fetch('/api/settings/timeslots');
        if (!response.ok) throw new Error('Failed to fetch time slots');
        const data = await response.json();
        setTimeSlots(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchTimeSlots();
  }, []);

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

  const handleSave = async () => {
    const slotData = { label, startTime, endTime };

    try {
      let response;
      if (editingSlot) {
        response = await fetch(`/api/settings/timeslots`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingSlot.id, ...slotData }),
        });
      } else {
        response = await fetch(`/api/settings/timeslots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slotData),
        });
      }
      if (!response.ok) throw new Error('Failed to save time slot');
      const updatedSlots = await (
        await fetch('/api/settings/timeslots')
      ).json();
      setTimeSlots(updatedSlots);
    } catch (error) {
      console.error(error);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this time slot?')) {
      try {
        const response = await fetch(`/api/settings/timeslots`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (!response.ok) throw new Error('Failed to delete time slot');
        setTimeSlots((prev) => prev.filter((t) => t.id !== id));
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
            Manage Time Slots
          </h2>
          <p className='text-gray-500 text-sm'>
            Define the schedule blocks for classes.
          </p>
        </div>
      </div>

      <Card className='p-0 overflow-hidden'>
        <div className='p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end'>
          <Button
            onClick={() => handleOpenModal()}
            startIcon={<Plus size={16} />}
          >
            {' '}
            Add Time Slot
          </Button>
        </div>
        <Table>
          <TableHead>
            <TableRow>
              <Th>Label</Th>
              <Th>Start Time</Th>
              <Th>End Time</Th>
              <Th>Actions</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {timeSlots.map((slot) => (
              <TableRow key={slot.id}>
                <TableCell>
                  <span className='font-medium'>{slot.label}</span>
                </TableCell>
                <TableCell>{slot.startTime}</TableCell>
                <TableCell>{slot.endTime}</TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <Button
                      variant='text'
                      size='sm'
                      onClick={() => handleOpenModal(slot)}
                    >
                      <Edit size={16} className='text-blue-600' />
                    </Button>
                    <Button
                      variant='text'
                      size='sm'
                      onClick={() => handleDelete(slot.id)}
                    >
                      <Trash2 size={16} className='text-red-600' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {timeSlots.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className='text-center py-6 text-gray-500'
                >
                  No time slots defined.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
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
            label='Label (e.g. Morning A)'
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <div className='grid grid-cols-2 gap-4'>
            <TextField
              label='Start Time'
              type='time'
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <TextField
              label='End Time'
              type='time'
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
