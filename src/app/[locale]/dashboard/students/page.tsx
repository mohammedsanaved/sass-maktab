'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Table, TableHead, TableRow, Th, TableCell, TableBody, Badge, Checkbox, Modal, TextField, Select } from '@/components/ui';
import { Search, Edit, ChevronLeft, ChevronRight, UserPlus, ArrowUpCircle, Loader2 } from 'lucide-react';
import { Student, ClassLevel, TimeSlot, StudyStatus, ClassSession } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { apiFetch } from '@/lib/api';
import Image from 'next/image';

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
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Academic Years
  const [academicYears, setAcademicYears] = useState<{value: string, label: string}[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 0
  });

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Promotion Modal
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState(''); // Target ClassId
  // For promotion, we now use actual Class Sessions to ensure combinations exist.
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [promoteAcademicYear, setPromoteAcademicYear] = useState('2025-2026');
  // Fetch Settings Data (Classes, TimeSlots, Sessions) - Only once on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [classesRes, timeSlotsRes, sessionsRes, yearsRes] = await Promise.all([
          apiFetch('/api/settings/classes'),
          apiFetch('/api/settings/timeslots'),
          apiFetch('/api/settings/class-sessions'),
          apiFetch('/api/settings/academic-years')
        ]);

        if (classesRes.ok) setClassLevels(await classesRes.json());
        if (timeSlotsRes.ok) setTimeSlots(await timeSlotsRes.json());
        if (sessionsRes.ok) setAvailableSessions(await sessionsRes.json());
        if (yearsRes.ok) setAcademicYears(await yearsRes.json());
        console.log(academicYears, "-----------------academicYears")
      } catch (error) {
        console.error("Failed to load settings", error);
      }
    };

    fetchSettings();
  }, []);

  // Fetch Students Data - Re-fetch when filters, pagination, or debounced search changes
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        // Build query parameters
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('limit', itemsPerPage.toString());
        
        if (debouncedSearchTerm) {
          params.append('search', debouncedSearchTerm);
        }
        if (filterClass) {
          params.append('classId', filterClass);
        }
        if (filterTimeSlot) {
          params.append('timeSlotId', filterTimeSlot);
        }
        if (filterStudyStatus) {
          params.append('studyStatus', filterStudyStatus);
        }
        if (filterAcademicYear) {
          params.append('academicYear', filterAcademicYear);
        }

        const studentsRes = await apiFetch(`/api/students?${params.toString()}`);

        if (studentsRes.ok) {
          const response = await studentsRes.json();
          // Handle both old format (array) and new format (object with data and pagination)
          if (Array.isArray(response)) {
            setStudents(response);
            setPagination({
              total: response.length,
              page: currentPage,
              limit: itemsPerPage,
              totalPages: Math.ceil(response.length / itemsPerPage)
            });
          } else {
            setStudents(response.data || []);
            setPagination(response.pagination || {
              total: 0,
              page: currentPage,
              limit: itemsPerPage,
              totalPages: 0
            });
          }
        }
      } catch (error) {
        console.error("Failed to load students", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [currentPage, debouncedSearchTerm, filterClass, filterTimeSlot, filterStudyStatus, filterAcademicYear, itemsPerPage]);

  // Students are already filtered and paginated by the server
  const paginatedStudents = students;

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
    const session = availableSessions.find(s => s.id === selectedSessionId);
    if (!session) {
      alert("Please select a target Class Session.");
      return;
    }

    try {
        const response = await apiFetch('/api/students/promote', {
            method: 'PUT',
            body: JSON.stringify({
                studentIds: Array.from(selectedIds),
                classId: session.classLevelId,
                timeSlotId: session.timeSlotId,
                academicYear: promoteAcademicYear
            })
        });

        if (response.ok) {
            alert("Promotion successful!");
            setIsPromoteModalOpen(false);
            setSelectedIds(new Set());
            setSelectedSessionId('');
            // Refresh data - rebuild query params
            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('limit', itemsPerPage.toString());
            if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
            if (filterClass) params.append('classId', filterClass);
            if (filterTimeSlot) params.append('timeSlotId', filterTimeSlot);
            if (filterStudyStatus) params.append('status', filterStudyStatus);
            
            const res = await apiFetch(`/api/students?${params.toString()}`);
            if (res.ok) {
              const response = await res.json();
              if (Array.isArray(response)) {
                setStudents(response);
              } else {
                setStudents(response.data || []);
                setPagination(response.pagination || pagination);
              }
            }
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
      // return <div className="flex h-96 items-center justify-center"><Image src={"/logo.png"} alt="Loading" width={100} height={100} loading='lazy' /></div>;
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
            // variant='contained'
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
              setCurrentPage(1); // Reset to first page when search changes
            }}
            className='mb-0'
          />
          <Select
            options={[
              { value: '', label: 'All Classes' },
              ...classLevels.map((c) => ({ value: c.id, label: c.name })),
            ]}
            label='Filter by Class'
            value={filterClass}
            onChange={(e) => {
              setFilterClass(e.target.value);
              setSelectedIds(new Set());
              setCurrentPage(1);
              // Reset academicYear when class is cleared
              if (!e.target.value) {
                setFilterAcademicYear('');
              }
            }}
          />
          {filterClass && (
            <Select
              options={[
                { value: '', label: 'All Academic Years' },
                ...academicYears,
              ]}
              label='Filter by Academic Year'
              value={filterAcademicYear}
              onChange={(e) => {
                setFilterAcademicYear(e.target.value);
                setCurrentPage(1);
              }}
            />
          )}
          <Select
            options={[
              { value: '', label: 'All Time Slots' },
              ...timeSlots.map((t) => ({ value: t.id, label: t.label })),
            ]}
            label='Filter by Time Slot'
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
            label='Filter by Status'
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
                    <span className='text-primary-600 hover:text-primary-800 hover:underline font-medium'>
                      {student.studentName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    className='flex flex-col group'
                  >
                    <span className='text-foreground transition-colors'>
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
                  {/* {student.classSession?.sectionName && (
                    <div className='text-xs text-gray-500 mt-1'>
                      {student.classSession.sectionName}
                    </div>
                  )} */}
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
            Showing {students.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} students
          </span>
          <div className='flex items-center gap-4'>
            <span className='text-sm text-gray-500'>
              Page {pagination.page} of {pagination.totalPages || 1}
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
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Session (Class + Time + Teacher)</label>
                <Select 
                    options={[
                        {value: '', label: 'Select Target Session...'}, 
                        ...availableSessions.map(s => ({ 
                            value: s.id, 
                            label: `${s.classLevel?.name || 'Unknown'} - ${s.timeSlot?.label || 'Unknown'} (${s.teacher?.name || 'No Teacher'})` 
                        }))
                    ]}
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                />
                <p className="mt-2 text-[10px] text-gray-500 italic">
                    Note: If a class is missing, please assign a teacher to it in Teacher Settings first.
                </p>
            </div>

            <TextField 
                label="Target Academic Year (تعلیمی سال)" 
                value={promoteAcademicYear} 
                onChange={e => setPromoteAcademicYear(e.target.value)} 
                placeholder="2025-2026"
                required
            />
        </div>
      </Modal>
    </div>
  );
}