// 'use client';
// import React, { useState, useEffect } from 'react';
// import {
//   Card,
//   Button,
//   Table,
//   TableHead,
//   TableRow,
//   Th,
//   TableCell,
//   Modal,
//   TextField,
//   TimeInput,
//   TableBody,
// } from '@/components/ui';
// import { Edit, Trash2, Plus, ArrowLeft, Loader2 } from 'lucide-react';
// import { apiFetch } from '@/lib/api';
// import { useRouter } from 'next/navigation';

// interface TimeSlot {
//   id: string;
//   label: string;
//   startTime: string;
//   endTime: string;
// }


// export default function ManageTimeSlots() {
//   const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   // Form State
//   const [label, setLabel] = useState('');
//   const [startTime, setStartTime] = useState('');
//   const [endTime, setEndTime] = useState('');
//   const router = useRouter();

//   // Load data on mount
//   useEffect(() => {
//     const fetchTimeSlots = async () => {
//       setIsLoading(true);
//       try {
//         const response = await apiFetch('/api/settings/timeslots');
//         if (!response.ok) throw new Error('Failed to fetch time slots');
//         const data = await response.json();
//         setTimeSlots(data);
//       } catch (error) {
//         console.error(error);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchTimeSlots();
//   }, []);

//   const handleOpenModal = (slot?: TimeSlot) => {
//     if (slot) {
//       setEditingSlot(slot);
//       setLabel(slot.label);
//       setStartTime(slot.startTime);
//       setEndTime(slot.endTime);
//     } else {
//       setEditingSlot(null);
//       setLabel('');
//       setStartTime('');
//       setEndTime('');
//     }
//     setIsModalOpen(true);
//   };

//   const handleSave = async () => {
//     const slotData = { label, startTime, endTime };

//     try {
//       let response;
//       if (editingSlot) {
//         // Fix: Use the [id] route for PUT requests
//         response = await apiFetch(`/api/settings/timeslots/${editingSlot.id}`, {
//           method: 'PUT',
//           body: JSON.stringify(slotData),
//         });
//       } else {
//         response = await apiFetch(`/api/settings/timeslots`, {
//           method: 'POST',
//           body: JSON.stringify(slotData),
//         });
//       }
//       if (!response.ok) throw new Error('Failed to save time slot');
//       const updatedSlots = await (
//         await apiFetch('/api/settings/timeslots')
//       ).json();
//       setTimeSlots(updatedSlots);
//     } catch (error) {
//       console.error(error);
//     }

//     setIsModalOpen(false);
//   };

//   const handleDelete = async (id: string) => {
//     if (window.confirm('Are you sure you want to delete this time slot?')) {
//       try {
//         // Fix: Use the [id] route for DELETE requests
//         const response = await apiFetch(`/api/settings/timeslots/${id}`, {
//           method: 'DELETE',
//         });
//         if (!response.ok) throw new Error('Failed to delete time slot');
//         setTimeSlots((prev) => prev.filter((t) => t.id !== id));
//       } catch (error) {
//         console.error(error);
//       }
//     }
//   };

//   return (
//     <div className='space-y-6'>
//       <div className='flex items-center justify-start gap-2'>
//         <Button variant="outlined" size="sm" onClick={() => router.push('/dashboard/settings')} className="p-2">
//             <ArrowLeft size={20} />
//           </Button>
//         <div>
//           <h2 className='text-2xl font-bold text-foreground'>
//             Manage Time Slots
//           </h2>
//           <p className='text-gray-500 text-sm'>
//             Define the schedule blocks for classes.
//           </p>
//         </div>
//       </div>

//       <Card className='p-0 overflow-hidden'>
//         <div className='p-4 border-none flex justify-end'>
//           <Button
//             onClick={() => handleOpenModal()}
//             startIcon={<Plus size={16} />}
//             variant='contained'
//           >
//             {' '}
//             Add Time Slot
//           </Button>
//         </div>
        
//         {isLoading ? (
//           <div className="flex h-64 items-center justify-center">
//             <Loader2 className="animate-spin text-primary-500" size={40} />
//           </div>
//         ) : (
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <Th>Label</Th>
//                 <Th>Start Time</Th>
//                 <Th>End Time</Th>
//                 <Th>Actions</Th>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {timeSlots.map((slot) => (
//                 <TableRow key={slot.id}>
//                   <TableCell>
//                     <span className='font-medium'>{slot.label}</span>
//                   </TableCell>
//                   <TableCell>{slot.startTime}</TableCell>
//                   <TableCell>{slot.endTime}</TableCell>
//                   <TableCell>
//                     <div className='flex gap-2'>
//                       <Button
//                         variant='text'
//                         size='sm'
//                         onClick={() => handleOpenModal(slot)}
//                       >
//                         <Edit size={16} className='text-blue-600' />
//                       </Button>
//                       <Button
//                         variant='text'
//                         size='sm'
//                         onClick={() => handleDelete(slot.id)}
//                       >
//                         <Trash2 size={16} className='text-red-600' />
//                       </Button>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ))}
//               {timeSlots.length === 0 && (
//                 <TableRow>
//                   <TableCell
//                     colSpan={4}
//                     className='text-center py-6 text-gray-500'
//                   >
//                     No time slots defined.
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
//         )}
//       </Card>

//       <Modal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title={editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
//         actions={
//           <div className='flex gap-2'>
//             <Button onClick={handleSave}>Save</Button>
//             <Button variant='text' onClick={() => setIsModalOpen(false)}>
//               Cancel
//             </Button>
//           </div>
//         }
//       >
//         <div className='space-y-4'>
//           <TextField
//             label='Label (e.g. Morning A)'
//             value={label}
//             onChange={(e) => setLabel(e.target.value)}
//           />
//           <div className='grid grid-cols-1 gap-4'>
//             <TimeInput
//               label='Start Time'
//               value={startTime}
//               onChange={setStartTime}
//               placeholder='09:00 AM'
//             />
//             <TimeInput
//               label='End Time'
//               value={endTime}
//               onChange={setEndTime}
//               placeholder='10:00 AM'
//             />
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// }
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Button,
  Table,
  TableHead,
  TableRow,
  Th,
  TableCell,
  TableBody,
} from '@/components/ui';
import { Edit, Trash2, Plus, ArrowLeft, Loader2, Clock, Tag, KeyRound } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { TimeSlotForm } from './TimeSlotForm';

interface TimeSlot {
  id: string;
  label: string;
  startTime: string; // Expected "09:00 AM"
  endTime: string;   // Expected "10:00 AM"
}

// Helper to sort time slots chronologically
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = (time || "").split(':').map(Number);
  if (modifier?.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + (minutes || 0);
};

// Helper to ensure 12-hour format display
const formatTo12Hour = (timeStr: string): string => {
  if (!timeStr) return '--:--';
  if (timeStr.includes(' ')) return timeStr; // Already 12h format

  const [hours, minutes] = timeStr.split(':');
  const h24 = parseInt(hours, 10);
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return `${h12.toString().padStart(2, '0')}:${(minutes || '00').padStart(2, '0')} ${period}`;
};

export default function ManageTimeSlots() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchTimeSlots = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/settings/timeslots');
      if (!response.ok) throw new Error('Failed to fetch time slots');
      const data = await response.json();
      setTimeSlots(data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  // Sort slots so the morning classes appear first in the table
  const sortedTimeSlots = useMemo(() => {
    return [...timeSlots].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [timeSlots]);

  const handleOpenForm = (slot?: TimeSlot) => {
    setEditingSlot(slot || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingSlot(null);
    setIsFormOpen(false);
  };

  const handleSave = async (values: any) => {
    const slotData = { ...values, id: editingSlot?.id };

    try {
      const method = editingSlot ? 'PUT' : 'POST';
      const url = editingSlot 
        ? `/api/settings/timeslots/${editingSlot.id}` 
        : '/api/settings/timeslots';

      const response = await apiFetch(url, {
        method: method,
        body: JSON.stringify(slotData),
      });

      if (!response.ok) throw new Error('Failed to save time slot');
      
      // Refresh data
      await fetchTimeSlots();
      handleCloseForm();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save time slot. Please check your network.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this time slot?')) {
      try {
        const response = await apiFetch(`/api/settings/timeslots/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete');
        setTimeSlots((prev) => prev.filter((t) => t.id !== id));
      } catch (error) {
        alert('Error deleting time slot.');
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
          <h2 className='text-2xl font-bold text-foreground'>Manage Time Slots</h2>
          <p className='text-muted-foreground text-sm'>Define the schedule blocks for classes.</p>
        </div>
      </div>

      <Card className='p-0 overflow-hidden'>
        <div className='p-4 flex justify-end'>
          <Button onClick={() => handleOpenForm()} variant='text'>
            <Plus size={16} className="mr-2" /> Add Time Slot
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <Th><Tag size={14} className='inline-block mr-1' /> Label</Th>
                <Th><Clock size={14} className='inline-block mr-1' /> Start Time</Th>
                <Th><Clock size={14} className='inline-block mr-1' /> End Time</Th>
                <Th><KeyRound size={14} className='inline-block mr-1' /> Actions</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTimeSlots.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell className='font-medium'>{slot.label}</TableCell>
                  <TableCell>{formatTo12Hour(slot.startTime)}</TableCell>
                  <TableCell>{formatTo12Hour(slot.endTime)}</TableCell>
                  <TableCell className="text-center">
                    <div className='flex text-right gap-2'>
                      <Button variant='text' size='sm' onClick={() => handleOpenForm(slot)}>
                        <Edit size={16} className='text-blue-600' />
                      </Button>
                      <Button variant='text' size='sm' onClick={() => handleDelete(slot.id)}>
                        <Trash2 size={16} className='text-red-600' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sortedTimeSlots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className='text-center py-10 text-muted-foreground'>
                    No time slots defined.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <TimeSlotForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSave}
        initialData={editingSlot}
      />
    </div>
  );
}
