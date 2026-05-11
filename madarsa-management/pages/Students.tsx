import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button, TableContainer, TableHead, TableRow, TableHeaderCell, TableCell, Badge, Checkbox, Modal, TextField } from '../components/ui';
import { Search, Edit, ChevronLeft, ChevronRight, UserPlus, ArrowUpCircle } from 'lucide-react';
import { studentsData as initialStudents, classLevels, timeSlots, classSessions } from '../services/mockData';
import { Student, StudyStatus, AdmissionStatus } from '../types';

export const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filters
  const [filterClass, setFilterClass] = useState('');
  const [filterTimeSlot, setFilterTimeSlot] = useState('');
  const [filterStudyStatus, setFilterStudyStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  
  // Promotion State
  const [targetSessionId, setTargetSessionId] = useState('');

  // Filter Logic
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
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

  const handlePromote = () => {
    if (!targetSessionId) {
      alert("Please select a target class session.");
      return;
    }

    const selectedSession = classSessions.find(cs => cs.id === targetSessionId);
    if (!selectedSession) return;

    setStudents(prev => prev.map(student => {
      if (selectedIds.has(student.id)) {
        return {
          ...student,
          classSessionId: targetSessionId,
          classSession: selectedSession
        };
      }
      return student;
    }));

    alert(`Promoted ${selectedIds.size} students to ${selectedSession.classLevelName} (${selectedSession.sectionName})`);
    setIsPromoteModalOpen(false);
    setSelectedIds(new Set());
    setTargetSessionId('');
  };

  const currentClassName = classLevels.find(cl => cl.id === filterClass)?.name || 'Selected Class';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Students Directory</h2>
        <div className="flex flex-wrap gap-2">
            {/* Promote Button: Only visible if a class is filtered */}
            {filterClass && (
                <Button 
                    variant="contained" 
                    color="secondary" 
                    disabled={selectedIds.size === 0}
                    onClick={() => setIsPromoteModalOpen(true)}
                >
                    <ArrowUpCircle size={18} className="mr-2" /> Promote Selected ({selectedIds.size})
                </Button>
            )}
            <Button variant="outlined" color="primary">Export CSV</Button>
            <Button variant="contained" color="primary" onClick={() => navigate('/students/new')}>
                <UserPlus size={18} className="mr-2" /> Admission New Student
            </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-1/3">
            <TextField 
              label="Search Students" 
              placeholder="Name or Roll No..." 
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-0"
            />
          </div>
          <div className="w-full md:w-1/4">
            <select 
              className="w-full h-12 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 text-gray-700 dark:text-gray-200"
              value={filterClass}
              onChange={(e) => { setFilterClass(e.target.value); setSelectedIds(new Set()); }}
            >
              <option value="">All Classes</option>
              {classLevels.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
            </select>
          </div>
          <div className="w-full md:w-1/4">
            <select 
              className="w-full h-12 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 text-gray-700 dark:text-gray-200"
              value={filterTimeSlot}
              onChange={(e) => setFilterTimeSlot(e.target.value)}
            >
              <option value="">All Time Slots</option>
              {timeSlots.map(ts => <option key={ts.id} value={ts.id}>{ts.label} ({ts.startTime} - {ts.endTime})</option>)}
            </select>
          </div>
          <div className="w-full md:w-1/4">
            <select 
              className="w-full h-12 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 text-gray-700 dark:text-gray-200"
              value={filterStudyStatus}
              onChange={(e) => setFilterStudyStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {Object.values(StudyStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <TableContainer className="border-none shadow-none">
          <TableHead>
            <TableRow>
              <TableHeaderCell>
                <Checkbox 
                  onChange={handleSelectAll} 
                  checked={paginatedStudents.length > 0 && selectedIds.size === paginatedStudents.length}
                />
              </TableHeaderCell>
              <TableHeaderCell>Roll No</TableHeaderCell>
              <TableHeaderCell>Student Info</TableHeaderCell>
              <TableHeaderCell>Class & Section</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {paginatedStudents.map((student) => (
              <TableRow key={student.id} className={selectedIds.has(student.id) ? 'bg-primary-50 dark:bg-primary-900/10' : ''}>
                <TableCell>
                  <Checkbox 
                    checked={selectedIds.has(student.id)} 
                    onChange={() => handleSelectOne(student.id)}
                  />
                </TableCell>
                <TableCell>{student.rollNumber}</TableCell>
                <TableCell>
                  <Link to={`/students/${student.id}`} className="flex flex-col group">
                    <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary-600 transition-colors">{student.studentName}</span>
                    <span className="text-xs text-gray-500">Guardian: {student.fatherName}</span>
                    <span className="text-xs text-gray-400">{student.mobile}</span>
                  </Link>
                </TableCell>
                <TableCell>
                   <Badge color="purple">{student.classSession?.classLevelName}</Badge>
                   <div className="text-xs text-gray-500 mt-1">{student.classSession?.sectionName}</div>
                   <div className="text-xs text-blue-500 mt-0.5">{student.classSession?.timeSlotLabel}</div>
                </TableCell>
                 <TableCell>
                  <Badge color={
                    student.studyStatus === StudyStatus.REGULAR ? 'green' : 
                    student.studyStatus === StudyStatus.IRREGULAR ? 'yellow' : 'blue'
                  }>
                    {student.studyStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => navigate(`/students/${student.id}/edit`)} 
                      className="p-1 text-blue-600 hover:text-blue-800 transition-transform active:scale-95"
                      title="Edit Student Record"
                    >
                      <Edit size={18} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
             {paginatedStudents.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">No students found matching filters.</TableCell>
                </TableRow>
             )}
          </tbody>
        </TableContainer>

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t dark:border-gray-700">
            <span className="text-sm text-gray-500">
                Showing {paginatedStudents.length} of {filteredStudents.length} students
            </span>
            <div className="flex gap-2">
                <Button variant="outlined" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft size={16} />
                </Button>
                <Button variant="outlined" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                    <ChevronRight size={16} />
                </Button>
            </div>
        </div>
      </Card>
      
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
                    You are moving <strong>{selectedIds.size}</strong> students from <strong>{currentClassName}</strong> to a new class level or session.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Target Class Session</label>
                <select 
                    className="w-full h-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg px-4 focus:outline-none focus:border-secondary-500 text-gray-900 dark:text-gray-100"
                    value={targetSessionId}
                    onChange={(e) => setTargetSessionId(e.target.value)}
                >
                    <option value="">Select Destination...</option>
                    {classSessions.map(session => (
                        <option key={session.id} value={session.id}>
                            {session.classLevelName} - {session.sectionName} ({session.timeSlotLabel})
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-2 italic">
                    Note: Students' roll numbers and other profile details will remain unchanged.
                </p>
            </div>
        </div>
      </Modal>
    </div>
  );
};