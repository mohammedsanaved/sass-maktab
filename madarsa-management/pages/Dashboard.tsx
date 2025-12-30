
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip 
} from 'recharts';
import { Card, TableContainer, TableHead, TableRow, TableHeaderCell, TableCell, Badge, Button } from '../components/ui';
import { Filter, Calendar, Users, DollarSign, TrendingUp, AlertCircle, PieChart as PieChartIcon, Phone, BookOpen, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { studentsData } from '../services/mockData';
import { StudyStatus, AdmissionStatus, StudentType } from '../types';

export const Dashboard = () => {
  // Date Filters (Global)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  // Local state for admissions
  const [admissions, setAdmissions] = useState(studentsData);

  // Table State
  const [tableStatusFilter, setTableStatusFilter] = useState<string>('ALL');
  const [tableCurrentPage, setTableCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const months = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
  ];
  const shortMonth = months[selectedMonth].substring(0, 3);

  // Stats Calculation based on Global Filters
  const stats = useMemo(() => {
    // 1. Total Students (Cumulative up to selected period)
    const studentsActiveInPeriod = admissions.filter(s => {
       return s.admissionDate ? new Date(s.admissionDate).getFullYear() <= selectedYear : true;
    });

    const totalStudents = studentsActiveInPeriod.length;
    const hafizCount = studentsActiveInPeriod.filter(s => s.type === StudentType.HAFIZ).length;
    const nazeraCount = studentsActiveInPeriod.filter(s => s.type === StudentType.NAZERA).length;
    
    // Status Counts for Pie Chart
    const regularCount = studentsActiveInPeriod.filter(s => s.studyStatus === StudyStatus.REGULAR).length;
    const irregularCount = studentsActiveInPeriod.filter(s => s.studyStatus === StudyStatus.IRREGULAR).length;
    const completedCount = studentsActiveInPeriod.filter(s => s.studyStatus === StudyStatus.COMPLETED).length;

    // 2. Fee Logic (Specific to selected Month)
    const expectedFee = studentsActiveInPeriod.reduce((acc, s) => acc + s.monthlyFees, 0);
    const variability = 0.6 + ((selectedMonth % 5) / 10); // 0.6 to 1.0
    const collectedFee = Math.round(expectedFee * variability);
    const unpaidCount = Math.round(studentsActiveInPeriod.length * (1 - variability));
    const collectionPercentage = Math.round((collectedFee / expectedFee) * 100) || 0;

    // 3. New Admissions (Strictly in this Month)
    const newAdmissionsCount = admissions.filter(s => {
      if (!s.admissionDate) return false;
      const d = new Date(s.admissionDate);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    }).length;

    return {
        totalStudents,
        hafizCount,
        nazeraCount,
        regularCount,
        irregularCount,
        completedCount,
        collectedFee,
        expectedFee,
        unpaidCount,
        newAdmissionsCount,
        collectionPercentage
    };
  }, [selectedYear, selectedMonth, admissions]);
  
  const statusPieData = [
    { name: 'Regular', value: stats.regularCount, color: '#10b981' }, // Green
    { name: 'Irregular', value: stats.irregularCount, color: '#f59e0b' }, // Yellow
    { name: 'Completed', value: stats.completedCount, color: '#3b82f6' }, // Blue
  ];

  // Admission Applications Table Logic
  const allApplications = useMemo(() => {
      return admissions.filter(s => {
          // Filter by status if not 'ALL'
          if (tableStatusFilter !== 'ALL' && s.admissionStatus !== tableStatusFilter) return false;
          
          // Original logic: Pending, In Progress, or Completed this year
          if (s.admissionStatus === AdmissionStatus.PENDING || s.admissionStatus === AdmissionStatus.IN_PROGRESS) return true;
          const sYear = s.admissionDate ? new Date(s.admissionDate).getFullYear() : 0;
          return sYear === selectedYear && s.admissionStatus === AdmissionStatus.COMPLETED;
      }).sort((a, b) => {
          if (a.admissionStatus === AdmissionStatus.PENDING && b.admissionStatus !== AdmissionStatus.PENDING) return -1;
          if (b.admissionStatus === AdmissionStatus.PENDING && a.admissionStatus !== AdmissionStatus.PENDING) return 1;
          return 0;
      });
  }, [admissions, selectedYear, tableStatusFilter]);

  const totalPages = Math.ceil(allApplications.length / itemsPerPage);
  const paginatedApplications = useMemo(() => {
    return allApplications.slice((tableCurrentPage - 1) * itemsPerPage, tableCurrentPage * itemsPerPage);
  }, [allApplications, tableCurrentPage]);

  const handleStatusChange = (studentId: string, newStatus: AdmissionStatus) => {
      setAdmissions(prev => prev.map(s => 
          s.id === studentId ? { ...s, admissionStatus: newStatus } : s
      ));
  };

  const handleTableStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTableStatusFilter(e.target.value);
    setTableCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h2>
          <p className="text-gray-500 dark:text-gray-400">Key metrics for {months[selectedMonth]} {selectedYear}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <div className="relative">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="h-10 pl-9 pr-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none appearance-none cursor-pointer"
              >
                  {months.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
              </select>
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-500 pointer-events-none" />
           </div>

           <div className="relative">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="h-10 pl-9 pr-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none appearance-none cursor-pointer"
              >
                  {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <Filter className="w-4 h-4 absolute left-3 top-3 text-gray-500 pointer-events-none" />
           </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Student Composition */}
        <Card className="flex flex-col justify-between border-l-4 border-primary-500">
          <div className="flex justify-between items-start">
            <div>
                 <p className="text-sm font-medium text-gray-500">Total Students</p>
                 <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{stats.totalStudents}</h3>
            </div>
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg text-primary-600">
                <Users size={20} />
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-xs font-medium text-gray-500">
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span> {stats.hafizCount} Hafiz</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-purple-500 mr-1"></span> {stats.nazeraCount} Nazera</span>
          </div>
        </Card>
        
        {/* Card 2: Financial Health (Filter Dependent) */}
        <Card className="flex flex-col justify-between border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500">Revenue ({shortMonth})</p>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">${stats.collectedFee.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg text-green-600">
                <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-3">
             <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{stats.collectionPercentage}% of Exp.</span>
             </div>
             <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.collectionPercentage}%` }}></div>
             </div>
          </div>
        </Card>
        
        {/* Card 3: Defaulters (Filter Dependent) */}
        <Card className="flex flex-col justify-between border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
                 <p className="text-sm font-medium text-gray-500">Unpaid ({shortMonth})</p>
                 <h3 className="text-3xl font-bold text-red-600 mt-1">{stats.unpaidCount}</h3>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg text-red-600">
                <AlertCircle size={20} />
            </div>
          </div>
          <p className="text-xs text-red-500 mt-2 font-medium">Action Required: Send Reminders</p>
        </Card>
        
        {/* Card 4: Growth (Highlighting seasonality) */}
         <Card className="flex flex-col justify-between border-l-4 border-blue-400">
           <div className="flex justify-between items-start">
            <div>
                 <p className="text-sm font-medium text-gray-500">New Admissions</p>
                 <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">+{stats.newAdmissionsCount}</h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-500">
                <TrendingUp size={20} />
            </div>
          </div>
           <p className="text-xs text-gray-500 mt-2">
             In {months[selectedMonth]} {stats.newAdmissionsCount === 0 && "(Off-Season)"}
           </p>
        </Card>
      </div>

      {/* Row 2: Charts and Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Attendance Status (Pie Chart) - Takes 1 column */}
        <Card className="xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                <PieChartIcon size={18} className="mr-2 text-primary-500"/>
                Attendance Status
             </h3>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
             <div className="flex justify-between text-sm">
                <span className="flex items-center text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>Regular
                </span>
                <span className="font-semibold">{stats.regularCount}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="flex items-center text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>Irregular
                </span>
                <span className="font-semibold">{stats.irregularCount}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="flex items-center text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>Completed
                </span>
                <span className="font-semibold">{stats.completedCount}</span>
             </div>
          </div>
        </Card>

        {/* Admission Applications Table - Takes 2 columns (wider) */}
        <Card className="xl:col-span-2 flex flex-col h-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Admission Applications</h3>
                    <p className="text-xs text-gray-500">Manage pending and recent applications</p>
                </div>
                <div className="flex items-center gap-2">
                    <select 
                        className="text-xs border border-gray-300 dark:border-gray-600 rounded-md p-1.5 outline-none bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:border-primary-500"
                        value={tableStatusFilter}
                        onChange={handleTableStatusFilterChange}
                    >
                        <option value="ALL">All Status</option>
                        <option value={AdmissionStatus.PENDING}>Pending</option>
                        <option value={AdmissionStatus.IN_PROGRESS}>In Progress</option>
                        <option value={AdmissionStatus.COMPLETED}>Confirmed</option>
                    </select>
                    <Badge color="blue">{allApplications.length} Total</Badge>
                </div>
            </div>
            
            <div className="flex-1 min-h-0">
                <TableContainer className="border-none shadow-none h-full">
                    <TableHead>
                        <TableRow>
                            <TableHeaderCell>Applicant</TableHeaderCell>
                            <TableHeaderCell>Parents Contact</TableHeaderCell>
                            <TableHeaderCell>Proposed Class</TableHeaderCell>
                            <TableHeaderCell>Status</TableHeaderCell>
                            <TableHeaderCell>Action</TableHeaderCell>
                        </TableRow>
                    </TableHead>
                    <tbody>
                        {paginatedApplications.map((student) => (
                        <TableRow key={student.id}>
                            <TableCell>
                                <Link to={`/students/${student.id}`} className="group">
                                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors">{student.studentName}</div>
                                    <div className="text-xs text-gray-500">{student.rollNumber}</div>
                                </Link>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{student.fatherName}</span>
                                    <span className="text-xs text-gray-500 flex items-center mt-0.5">
                                        <Phone size={10} className="mr-1" /> {student.mobile}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                     <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200">
                                        <BookOpen size={12} className="mr-1.5 text-primary-500" />
                                        {student.classSession?.classLevelName}
                                     </div>
                                     <div className="flex items-center text-xs text-blue-500 mt-1">
                                        <Clock size={10} className="mr-1" />
                                        {student.classSession?.timeSlotLabel}
                                     </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge color={
                                    student.admissionStatus === AdmissionStatus.COMPLETED ? 'green' : 
                                    student.admissionStatus === AdmissionStatus.IN_PROGRESS ? 'yellow' : 'red'
                                }>
                                    {student.admissionStatus === AdmissionStatus.COMPLETED ? 'Confirmed' : student.admissionStatus}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <select 
                                    className={`text-xs border rounded p-1.5 outline-none font-medium cursor-pointer w-32 transition-colors
                                        ${student.admissionStatus === AdmissionStatus.COMPLETED 
                                            ? 'bg-green-50 border-green-200 text-green-700' 
                                            : student.admissionStatus === AdmissionStatus.IN_PROGRESS 
                                              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                                              : 'bg-white border-gray-300 text-gray-700 focus:border-primary-500'}`}
                                    value={student.admissionStatus}
                                    onChange={(e) => handleStatusChange(student.id, e.target.value as AdmissionStatus)}
                                >
                                    <option value={AdmissionStatus.PENDING}>Pending</option>
                                    <option value={AdmissionStatus.IN_PROGRESS}>In Progress</option>
                                    <option value={AdmissionStatus.COMPLETED}>Confirm</option>
                                </select>
                            </TableCell>
                        </TableRow>
                        ))}
                        {paginatedApplications.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500 py-10 text-xs" >No applications found for this filter.</TableCell>
                            </TableRow>
                        )}
                    </tbody>
                </TableContainer>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 mt-auto">
                    <div className="text-xs text-gray-700 dark:text-gray-400">
                        Showing <span className="font-medium">{(tableCurrentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(tableCurrentPage * itemsPerPage, allApplications.length)}</span> of <span className="font-medium">{allApplications.length}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outlined" 
                            size="sm"
                            disabled={tableCurrentPage === 1} 
                            onClick={() => setTableCurrentPage(p => p - 1)}
                            className="px-2"
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <Button 
                            variant="outlined" 
                            size="sm"
                            disabled={tableCurrentPage === totalPages} 
                            onClick={() => setTableCurrentPage(p => p + 1)}
                            className="px-2"
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            )}
        </Card>
      </div>
    </div>
  );
};
