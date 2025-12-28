import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, TextField, Modal, Checkbox } from '../components/ui';
import { classSessions as initialSessions, teachers, timeSlots, classLevels } from '../services/mockData';
import { Search, Edit, Phone, BookOpen, Clock } from 'lucide-react';
import { ClassSession } from '../types';

export const Teachers = () => {
  // State for sessions (since we edit them)
  const [sessions, setSessions] = useState<ClassSession[]>(initialSessions);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  // Keeping the existing time slot filter as it might still be useful
  const [filterTimeSlotId, setFilterTimeSlotId] = useState('');

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  
  // Temporary state for the modal selection
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

  // Derived Data
  const getTeacherSessions = (teacherId: string) => sessions.filter(s => s.teacherId === teacherId);

  // Filter Logic
  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      // 1. Search Filter (Name or Mobile)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        teacher.name.toLowerCase().includes(searchLower) || 
        teacher.phone.includes(searchLower);

      if (!matchesSearch) return false;

      // Get sessions for this teacher to check class/time filters
      const teacherSessions = getTeacherSessions(teacher.id);

      // 2. Class Filter
      const matchesClass = !filterClassId || teacherSessions.some(s => s.classLevelId === filterClassId);
      
      // 3. Time Slot Filter
      const matchesTime = !filterTimeSlotId || teacherSessions.some(s => s.timeSlotId === filterTimeSlotId);

      return matchesClass && matchesTime;
    });
  }, [teachers, sessions, searchQuery, filterClassId, filterTimeSlotId]);

  // Modal Handlers
  const handleEditClick = (teacherId: string) => {
    setEditingTeacherId(teacherId);
    const teacherSessions = getTeacherSessions(teacherId);
    // Create a Set of "classId-timeId" strings
    const currentSlots = new Set(teacherSessions.map(s => `${s.classLevelId}-${s.timeSlotId}`));
    setSelectedSlots(currentSlots);
    setIsEditModalOpen(true);
  };

  const toggleSlot = (classId: string, timeId: string) => {
    const key = `${classId}-${timeId}`;
    const newSet = new Set(selectedSlots);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedSlots(newSet);
  };

  const handleSaveAssignments = () => {
    if (!editingTeacherId) return;

    // 1. Remove all old sessions for this teacher
    const otherSessions = sessions.filter(s => s.teacherId !== editingTeacherId);

    // 2. Create new sessions from selectedSlots
    const newSessions: ClassSession[] = [];
    const teacher = teachers.find(t => t.id === editingTeacherId);

    selectedSlots.forEach(slotKey => {
      const [classId, timeId] = slotKey.split('-');
      const classLevel = classLevels.find(c => c.id === classId);
      const timeSlot = timeSlots.find(t => t.id === timeId);

      // Find if we had an existing session for this slot to preserve metadata like sectionName
      const oldSession = initialSessions.find(s => 
        s.teacherId === editingTeacherId && s.classLevelId === classId && s.timeSlotId === timeId
      );

      newSessions.push({
        id: oldSession?.id || Math.random().toString(36).substr(2, 9),
        teacherId: editingTeacherId,
        classLevelId: classId,
        timeSlotId: timeId,
        sectionName: oldSession?.sectionName || 'Section A', // Default if new
        maxStudents: oldSession?.maxStudents || 30,
        teacherName: teacher?.name,
        classLevelName: classLevel?.name,
        timeSlotLabel: timeSlot?.label
      });
    });

    setSessions([...otherSessions, ...newSessions]);
    setIsEditModalOpen(false);
    setEditingTeacherId(null);
  };

  // Validation Logic for Modal
  const isSlotTakenByOthers = (classId: string, timeId: string) => {
    return sessions.some(s => 
      s.classLevelId === classId && 
      s.timeSlotId === timeId && 
      s.teacherId !== editingTeacherId
    );
  };
  
  const getTakenByTeacherName = (classId: string, timeId: string) => {
      const session = sessions.find(s => 
        s.classLevelId === classId && 
        s.timeSlotId === timeId && 
        s.teacherId !== editingTeacherId
      );
      return session?.teacherName;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Teachers & Class Schedules</h2>
        <Button onClick={() => alert("Add Teacher functionality would go here.")}>+ Add Teacher</Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <TextField 
            label="Search Teacher" 
            placeholder="Name or Mobile Number..." 
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-0"
          />
          
          <div className="mb-0">
             <label className="text-xs text-gray-500 mb-1 block">Filter by Class</label>
             <select 
               className="w-full h-12 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 text-gray-700 dark:text-gray-200"
               value={filterClassId}
               onChange={(e) => setFilterClassId(e.target.value)}
             >
               <option value="">All Classes</option>
               {classLevels.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
             </select>
          </div>

           <div className="mb-0">
             <label className="text-xs text-gray-500 mb-1 block">Filter by Time Slot</label>
             <select 
               className="w-full h-12 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 text-gray-700 dark:text-gray-200"
               value={filterTimeSlotId}
               onChange={(e) => setFilterTimeSlotId(e.target.value)}
             >
               <option value="">All Time Slots</option>
               {timeSlots.map(ts => <option key={ts.id} value={ts.id}>{ts.label} ({ts.startTime} - {ts.endTime})</option>)}
             </select>
          </div>
        </div>
      </Card>

      {/* Teacher Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map(teacher => {
             const mySessions = getTeacherSessions(teacher.id);
             
             return (
               <Card key={teacher.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                 {/* Edit Button */}
                 <button 
                    onClick={() => handleEditClick(teacher.id)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                    title="Edit Assignments"
                 >
                    <Edit size={18} />
                 </button>

                 <div className="flex items-center space-x-4 mb-4">
                   <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-bold text-lg">
                     {teacher.name.charAt(0)}
                   </div>
                   <div>
                     <h3 className="font-bold text-gray-800 dark:text-white">{teacher.name}</h3>
                     <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Phone size={12} className="mr-1" />
                        {teacher.phone}
                     </div>
                   </div>
                 </div>
                 
                 <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                    <h4 className="text-xs font-semibold uppercase text-gray-400 mb-3 tracking-wider">Assigned Classes</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {mySessions.length > 0 ? mySessions.map(session => (
                        <div key={session.id} className="flex flex-col bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
                                    <BookOpen size={12} className="mr-1.5 text-primary-500"/>
                                    {session.classLevelName}
                                </span>
                                <Badge color="blue" >{session.sectionName}</Badge>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-500 pl-4">
                                <span className="flex items-center">
                                    <Clock size={12} className="mr-1"/>
                                    {session.timeSlotLabel}
                                </span>
                                <span>{session.maxStudents} Students</span>
                            </div>
                        </div>
                        )) : (
                        <p className="text-sm text-gray-400 italic py-2 text-center">No classes assigned.</p>
                        )}
                    </div>
                 </div>
               </Card>
             )
          })}
          {filteredTeachers.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                  No teachers found matching your search.
              </div>
          )}
      </div>

      {/* Edit Assignments Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Assign Classes"
        actions={
            <>
                <Button onClick={handleSaveAssignments}>Save Assignments</Button>
                <Button variant="text" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            </>
        }
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2">
            <p className="text-sm text-gray-500 mb-4">
                Select the classes and time slots for <b>{teachers.find(t => t.id === editingTeacherId)?.name}</b>.
                Slots assigned to other teachers are disabled.
            </p>

            <div className="space-y-6">
                {classLevels.map(cls => (
                    <div key={cls.id} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                            <BookOpen size={16} className="mr-2 text-primary-500" />
                            {cls.name}
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {timeSlots.map(slot => {
                                const isTaken = isSlotTakenByOthers(cls.id, slot.id);
                                const isSelected = selectedSlots.has(`${cls.id}-${slot.id}`);
                                const takenByName = isTaken ? getTakenByTeacherName(cls.id, slot.id) : '';

                                return (
                                    <label 
                                        key={slot.id} 
                                        className={`flex items-center justify-between p-3 rounded border transition-all cursor-pointer
                                            ${isTaken 
                                                ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed' 
                                                : isSelected 
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' 
                                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-primary-300'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <Checkbox 
                                                checked={isSelected}
                                                disabled={isTaken}
                                                onChange={() => toggleSlot(cls.id, slot.id)}
                                            />
                                            <div className="ml-3">
                                                <span className={`block text-sm font-medium ${isTaken ? 'text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                                                    {slot.label}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {slot.startTime} - {slot.endTime}
                                                </span>
                                            </div>
                                        </div>
                                        {isTaken && (
                                            <span className="text-xs text-red-500 font-medium px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded">
                                                {takenByName}
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </Modal>
    </div>
  );
};