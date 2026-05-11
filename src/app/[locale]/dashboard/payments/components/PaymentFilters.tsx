import React from 'react';
import { Card, TextField, Select } from '@/components/ui';
import { Search } from 'lucide-react';
import { ClassLevel, TimeSlot, ClassSession } from '../types';

interface PaymentFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  classId: string;
  setClassId: (value: string) => void;
  timeSlotId: string;
  setTimeSlotId: (value: string) => void;
  classSessionId: string;
  setClassSessionId: (value: string) => void;
  classLevels: ClassLevel[];
  timeSlots: TimeSlot[];
  availableSessions: ClassSession[];
}

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  search,
  setSearch,
  classId,
  setClassId,
  timeSlotId,
  setTimeSlotId,
  classSessionId,
  setClassSessionId,
  classLevels,
  timeSlots,
  availableSessions,
}) => {
  return (
    <Card className='mb-6'>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <TextField
          icon={Search}
          label='Search'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={classId}
          label='Filter by Class'
          onChange={(e) => setClassId(e.target.value)}
          options={[
            { value: '', label: 'All Classes' },
            ...classLevels.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <Select
          value={timeSlotId}
          label='Filter by Time Slot'
          onChange={(e) => setTimeSlotId(e.target.value)}
          options={[
            { value: '', label: 'All Time Slots' },
            ...timeSlots.map((t) => ({ value: t.id, label: t.label })),
          ]}
        />
        <Select
          value={classSessionId}
          label='Filter by Teacher/Session'
          onChange={(e) => setClassSessionId(e.target.value)}
          options={[
            { value: '', label: 'All Teachers' },
            ...availableSessions.map((s) => ({
              value: s.id,
              label: `${s.classLevel?.name} - ${s.timeSlot?.label} (${s.teacher?.name})`,
            })),
          ]}
        />
      </div>
    </Card>
  );
};
