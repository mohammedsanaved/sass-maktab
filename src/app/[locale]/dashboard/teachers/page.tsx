'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Button, Badge, TextField, Modal, Checkbox, Select } from '@/components/ui';
import { Search, Edit, Phone, BookOpen, Clock, Loader2, Mail } from 'lucide-react';
import { TeacherWithDetails, ClassLevel, TimeSlot, ClassSession } from '@/types';

import { apiFetch } from '@/lib/api';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Settings for filters/assignments
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [allSessions, setAllSessions] = useState<ClassSession[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [filterTimeSlotId, setFilterTimeSlotId] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherWithDetails | null>(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, cRes, tsRes] = await Promise.all([
        apiFetch('/api/teacherswithclassdetails'),
        apiFetch('/api/settings/classes'),
        apiFetch('/api/settings/timeslots')
      ]);

      if (tRes.ok) setTeachers(await tRes.json());
      if (cRes.ok) setClassLevels(await cRes.json());
      if (tsRes.ok) setTimeSlots(await tsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived filtered list
  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        teacher.name.toLowerCase().includes(searchLower) || 
        teacher.phone?.includes(searchLower) ||
        teacher.email?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      const matchesClass = !filterClassId || teacher.classes.some(c => c.classLevel.id === filterClassId);
      const matchesTime = !filterTimeSlotId || teacher.classes.some(c => c.timeSlots.some(ts => ts.id === filterTimeSlotId));

      return matchesClass && matchesTime;
    });
  }, [teachers, searchQuery, filterClassId, filterTimeSlotId]);

  // Assignment Modal Handlers
  const handleEditAssignments = (teacher: TeacherWithDetails) => {
    setEditingTeacher(teacher);
    setSelectedClassId('');
    setSelectedSlotIds([]);
    setIsModalOpen(true);
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
    // Find existing slots for this teacher in this class
    const existingClass = editingTeacher?.classes.find(c => c.classLevel.id === classId);
    if (existingClass) {
      setSelectedSlotIds(existingClass.timeSlots.map(ts => ts.id));
    } else {
      setSelectedSlotIds([]);
    }
  };

  const toggleSlot = (slotId: string) => {
    setSelectedSlotIds(prev => 
      prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!editingTeacher || !selectedClassId) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/teacherswithclassdetails', {
        method: 'PUT',
        body: JSON.stringify({
          teacherId: editingTeacher.id,
          classId: selectedClassId,
          timeSlotIds: selectedSlotIds
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData(); // Refresh list
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update assignments");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && teachers.length === 0) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary-500" size={40} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Teachers & Schedules</h2>
          <p className="text-sm text-gray-500">Manage teacher assignments and class schedules</p>
        </div>
        {/* <Button variant="contained" color="primary" onClick={() => alert("Redirect to Add Teacher")}>
          + Add Teacher
        </Button> */}
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <TextField 
            label="Search Teacher" 
            placeholder="Name, Phone or Email..." 
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-0"
          />
          
          <div className="mb-0">
             {/* <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Filter by Class</label> */}
             <Select 
             label='Filter by Class'
                options={[{value: '', label: 'All Classes'}, ...classLevels.map(c => ({ value: c.id, label: c.name }))]}
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
             />
          </div>

           <div className="mb-0">
             {/* <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Filter by Time Slot</label> */}
             <Select 
             label='Filter by Time Slot'
                options={[{value: '', label: 'All Time Slots'}, ...timeSlots.map(ts => ({ value: ts.id, label: ts.label }))]}
                value={filterTimeSlotId}
                onChange={(e) => setFilterTimeSlotId(e.target.value)}
             />
          </div>
        </div>
      </Card>

      {/* Teacher Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map(teacher => (
            <Card key={teacher.id} variant="neubrutal" className="relative group border-t-4 border-primary-500">
               {/* Edit Button */}
               <button 
                  onClick={() => handleEditAssignments(teacher)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
                  title="Assign Classes"
               >
                  <Edit size={18} />
               </button>

               <div className="flex items-center space-x-4 mb-6">
                 <div className="w-14 h-14 bg-primary-100 text-foreground rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner uppercase">
                   {teacher.name.charAt(0)}
                 </div>
                 <div>
                   <h3 className="font-bold text-lg text-foreground leading-tight">{teacher.name}</h3>
                   <div className="space-y-0.5 mt-1">
                      {teacher.phone && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Phone size={12} className="mr-1.5 text-gray-400" />
                          {teacher.phone}
                        </div>
                      )}
                      {teacher.email && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Mail size={12} className="mr-1.5 text-gray-400" />
                          {teacher.email}
                        </div>
                      )}
                   </div>
                 </div>
               </div>
               
               <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-widest flex items-center">
                    <BookOpen size={12} className="mr-1.5" /> Assigned Classes
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {teacher.classes.length > 0 ? teacher.classes.map((cls, idx) => (
                        <div key={idx} className="bg-primary-50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-foreground text-sm">
                                    {cls.classLevel.name}
                                </span>
                                <Badge color="blue" size="sm" variant="soft">{cls.totalStudents} Students</Badge>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {cls.timeSlots.map(ts => (
                                  <div key={ts.id} className="flex items-center px-2  py-0.5 bg-white rounded-md text-[10px] text-gray-700 border border-gray-100 shadow-sm">
                                    <Clock size={10} className="mr-1 text-primary-500" />
                                    {ts.label}
                                  </div>
                                ))}
                            </div>
                        </div>
                      )) : (
                        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-400 italic">No classes assigned yet.</p>
                        </div>
                      )}
                  </div>
               </div>
            </Card>
          ))}
          {filteredTeachers.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-800/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                  <Search size={48} className="text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No results found for "{searchQuery}"</p>
                  <Button variant="text" color="primary" onClick={() => {setSearchQuery(''); setFilterClassId(''); setFilterTimeSlotId('');}}>Clear all filters</Button>
              </div>
          )}
      </div>

      {/* Assign Classes Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Class Assignment"
        actions={
          <div className="flex gap-2">
            <Button variant="text" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button color="primary" onClick={handleSaveAssignments} isLoading={submitting} disabled={!selectedClassId}>
               Save Assignments
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
                <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center font-bold text-primary-600 shadow-sm uppercase">
                    {editingTeacher?.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs text-primary-600 font-bold uppercase tracking-wider">Teacher</p>
                  <p className="font-bold text-foreground">{editingTeacher?.name}</p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-widest">Select Class Level</label>
                  <Select 
                      options={[{value: '', label: 'Choose a class...'}, ...classLevels.map(c => ({ value: c.id, label: c.name }))]}
                      value={selectedClassId}
                      onChange={(e) => handleClassSelect(e.target.value)}
                  />
                </div>

                {selectedClassId && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-bold text-gray-400 uppercase mb-3 block tracking-widest">Available Time Slots</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {timeSlots.map(slot => {
                            // Check if taken by someone ELSE (not this teacher)
                            const takenBy = teachers.find(t => 
                              t.id !== editingTeacher?.id && 
                              t.classes.some(c => c.classLevel.id === selectedClassId && c.timeSlots.some(ts => ts.id === slot.id))
                            );
                            const isSelected = selectedSlotIds.includes(slot.id);

                            return (
                                <div 
                                  key={slot.id} 
                                  onClick={() => !takenBy && toggleSlot(slot.id)}
                                  className={`
                                    p-4 rounded-2xl border-2 transition-all cursor-pointer group
                                    ${takenBy 
                                      ? 'bg-gray-50 dark:bg-gray-800 opacity-60 border-gray-100 dark:border-gray-700 cursor-not-allowed' 
                                      : isSelected
                                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 shadow-sm'
                                        : 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600 hover:border-primary-200'
                                    }
                                  `}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Checkbox 
                                              checked={isSelected} 
                                              disabled={!!takenBy} 
                                              onChange={() => {}} // Controlled by div click
                                            />
                                            <div>
                                              <p className={`text-sm font-bold ${takenBy ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>{slot.label}</p>
                                              <p className="text-[10px] text-gray-400">{slot.startTime} - {slot.endTime}</p>
                                            </div>
                                        </div>
                                        {takenBy && (
                                            <Badge color="red" size="sm" variant="soft">Taken: {takenBy.name}</Badge>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                  </div>
                )}
            </div>
        </div>
      </Modal>
    </div>
  );
}