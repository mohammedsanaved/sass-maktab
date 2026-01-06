'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Table, TableHead, TableRow, Th, TableCell, TableBody, Badge, Checkbox, Modal, TextField, Select } from '@/components/ui';
import { Search, Edit, ChevronLeft, ChevronRight, UserPlus, ArrowUpCircle, Loader2 } from 'lucide-react';
import { Student, ClassLevel, TimeSlot, StudyStatus, ClassSession } from '@/types';

import { apiFetch } from '@/lib/api';

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Settings Data for Filters
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  // We need class sessions for promotion target
  const [availableSessions, setAvailableSessions] = useState<ClassSession[]>([]); 

  // Filters & Search
  const [filterClass, setFilterClass] = useState('');
  const [filterTimeSlot, setFilterTimeSlot] = useState('');
  const [filterStudyStatus, setFilterStudyStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Promotion Modal
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState(''); // Target ClassId
  // For promotion, usually we need Class + TimeSlot. The generic API /students/promote needs {classId, timeSlotId}.
  // But wait, the API expects existing ClassSession? Or just IDs? 
  // Let's implement dynamic session fetching or just use Class + Time dropdowns in modal.
  const [targetClassId, setTargetClassId] = useState('');
  const [targetTimeSlotId, setTargetTimeSlotId] = useState('');
  // Fetch Initial Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Parallel fetching
        const [studentsRes, classesRes, timeSlotsRes] = await Promise.all([
          apiFetch('/api/students'),
          apiFetch('/api/settings/classes'),
          apiFetch('/api/settings/timeslots')
        ]);


        if (studentsRes.ok) {
            const data = await studentsRes.json();
            setStudents(Array.isArray(data) ? data : []);
        }
        if (classesRes.ok) setClassLevels(await classesRes.json());
        if (timeSlotsRes.ok) setTimeSlots(await timeSlotsRes.json());

      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter Logic
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const sName = student.studentName?.toLowerCase() || '';
      const sRoll = student.rollNumber?.toLowerCase() || '';
      const q = searchTerm.toLowerCase();

      const matchesSearch = sName.includes(q) || sRoll.includes(q);
      
      const matchesClass = filterClass ? student.classSession?.classLevelId === filterClass : true;
      const matchesTimeSlot = filterTimeSlot ? student.classSession?.timeSlotId === filterTimeSlot : true;
      const matchesStatus = filterStudyStatus ? student.studyStatus === filterStudyStatus : true;
      
      return matchesSearch && matchesClass && matchesTimeSlot && matchesStatus;
    });
  }, [students, searchTerm, filterClass, filterTimeSlot, filterStudyStatus]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedStudents.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  // Promotion Handler
  const handlePromote = async () => {
    if (!targetClassId || !targetTimeSlotId) {
      alert("Please select both target Class and Time Slot.");
      return;
    }

    try {
        const response = await apiFetch('/api/students/promote', {
            method: 'PUT',
            body: JSON.stringify({
                studentIds: Array.from(selectedIds),
                classId: targetClassId,
                timeSlotId: targetTimeSlotId
            })
        });

        if (response.ok) {
            alert("Promotion successful!");
            setIsPromoteModalOpen(false);
            setSelectedIds(new Set());
            // Refresh data
            const res = await apiFetch('/api/students');
            if (res.ok) setStudents(await res.json());
        } else {
            const err = await response.json();
            alert(`Failed to promote: ${err.error || 'Unknown error'}`);
        }
    } catch (e) {
        console.error(e);
        alert("An error occurred during promotion.");
    }
  };

  const handleExport = async () => {
      try {
        const response = await apiFetch('/api/students/export');
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            alert("Failed to export students.");
        }
      } catch (error) {
          console.error(error);
          alert("Error exporting data.");
      }
  };

  // View Helpers
  const getClassName = (id?: string) => classLevels.find(c => c.id === id)?.name || 'N/A';
  const getTimeSlotLabel = (id?: string) => timeSlots.find(t => t.id === id)?.label || 'N/A';


  if (loading) {
      return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary-500" size={40} /></div>;
  }

  return (
    <div className='p-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
        <h1 className='text-2xl font-bold'>Students Directory</h1>
        <div className='flex flex-wrap gap-2'>
          {/* Promote Button: Only visible if a class is filtered or students selected */}
          {(filterClass || selectedIds.size > 0) && (
            <Button
              variant='contained'
              color='secondary'
              disabled={selectedIds.size === 0}
              onClick={() => setIsPromoteModalOpen(true)}
            >
              <ArrowUpCircle size={18} className='mr-2' /> Promote Selected (
              {selectedIds.size})
            </Button>
          )}
          <Button variant='outlined' color='primary' onClick={handleExport}>
            Export CSV
          </Button>
          <Button
            variant='contained'
            color='primary'
            onClick={() => router.push('/dashboard/students/new')}
          >
            <UserPlus size={18} className='mr-2' /> Admission New Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className='mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <TextField
            label='Search Students'
            placeholder='Name or Roll No...'
            icon={Search}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className='mb-0'
          />
          <Select
            options={[
              { value: '', label: 'All Classes' },
              ...classLevels.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={filterClass}
            onChange={(e) => {
              setFilterClass(e.target.value);
              setSelectedIds(new Set());
              setCurrentPage(1);
            }}
          />
          <Select
            options={[
              { value: '', label: 'All Time Slots' },
              ...timeSlots.map((t) => ({ value: t.id, label: t.label })),
            ]}
            value={filterTimeSlot}
            onChange={(e) => {
              setFilterTimeSlot(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              ...Object.values(StudyStatus).map((s) => ({
                value: s,
                label: s,
              })),
            ]}
            value={filterStudyStatus}
            onChange={(e) => {
              setFilterStudyStatus(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </Card>

      {/* Table */}
      <Card className='p-0 overflow-hidden'>
        <Table>
          <TableHead>
            <TableRow>
              <Th>
                <Checkbox
                  onChange={handleSelectAll}
                  checked={
                    paginatedStudents.length > 0 &&
                    selectedIds.size === paginatedStudents.length
                  }
                />
              </Th>
              <Th>Roll No</Th>
              <Th>Student Info</Th>
              <Th>Guardian Info</Th>
              <Th>Class & Section</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedStudents.map((student) => (
              <TableRow
                key={student.id}
                className={
                  selectedIds.has(student.id)
                    ? 'bg-primary-50 dark:bg-primary-900/10'
                    : ''
                }
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(student.id)}
                    onChange={() => handleSelectOne(student.id)}
                  />
                </TableCell>
                <TableCell>{student.rollNumber}</TableCell>
                <TableCell>
                  <div
                    onClick={() =>
                      router.push(`/dashboard/students/${student.id}`)
                    }
                    className='flex flex-col group cursor-pointer'
                  >
                    <span className='font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary-600 transition-colors'>
                      {student.studentName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    onClick={() =>
                      router.push(`/dashboard/students/${student.id}`)
                    }
                    className='flex flex-col group cursor-pointer'
                  >
                    <span className='font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary-600 transition-colors'>
                      {student.fatherName}
                    </span>
                    <span className='text-xs text-gray-500'>
                      {student.mobile}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge color='purple'>
                    {student.classSession?.classLevel?.name || 'Unassigned'}
                  </Badge>
                  {student.classSession?.sectionName && (
                    <div className='text-xs text-gray-500 mt-1'>
                      {student.classSession.sectionName}
                    </div>
                  )}
                  <div className='text-xs text-blue-500 mt-0.5'>
                    {student.classSession?.timeSlot?.label || ''}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    color={
                      student.studyStatus === StudyStatus.REGULAR
                        ? 'green'
                        : student.studyStatus === StudyStatus.IRREGULAR
                        ? 'yellow'
                        : 'blue'
                    }
                  >
                    {student.studyStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className='flex space-x-2'>
                    <button
                      onClick={() =>
                        router.push(`/dashboard/students/${student.id}/edit`)
                      }
                      className='p-1 text-blue-600 hover:text-blue-800 transition-transform active:scale-95'
                      title='Edit Student Record'
                    >
                      <Edit size={18} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {paginatedStudents.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='text-center py-10 text-gray-500'
                >
                  No students found matching filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

        {/* Pagination */}
        <div className='flex items-center justify-between px-6 py-4'>
          <span className='text-sm text-gray-500'>
            Page {currentPage} of {totalPages}
          </span>
          <div className='flex gap-2'>
            <Button
              variant='outlined'
              size='sm'
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant='outlined'
              size='sm'
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      
      {/* Promotion Modal */}
      <Modal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        title={`Promote ${selectedIds.size} Students`}
        actions={
          <div className="flex gap-2">
            <Button variant="text" onClick={() => setIsPromoteModalOpen(false)}>Cancel</Button>
            <Button color="secondary" onClick={handlePromote}>Confirm Promotion</Button>
          </div>
        }
      >
        <div className="space-y-6">
            <div className="p-4 bg-secondary-50 dark:bg-secondary-900/10 border border-secondary-100 dark:border-secondary-800 rounded-lg">
                <p className="text-sm text-secondary-800 dark:text-secondary-200">
                    Moving <strong>{selectedIds.size}</strong> students to a new class level.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Class</label>
                <Select 
                    options={[{value: '', label: 'Select Class...'}, ...classLevels.map(c => ({ value: c.id, label: c.name }))]}
                    value={targetClassId}
                    onChange={(e) => setTargetClassId(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Time Slot</label>
                <Select 
                    options={[{value: '', label: 'Select Time Slot...'}, ...timeSlots.map(t => ({ value: t.id, label: t.label }))]}
                    value={targetTimeSlotId}
                    onChange={(e) => setTargetTimeSlotId(e.target.value)}
                />
            </div>
        </div>
      </Modal>
    </div>
  );
}