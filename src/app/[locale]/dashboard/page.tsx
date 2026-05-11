// src/app/[locale]/(dashboard)/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Table,
  TableHead,
  TableRow,
  Th,
  TableCell,
  Badge,
  Button,
} from '@/components/ui';
import { Link } from '@/i18n/routing';
import {
  Filter,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  PieChart as PieChartIcon,
  Phone,
  BookOpen,
  Clock,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

type AdmissionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

interface DashboardOverview {
  totalStudents: number;
  hafizCount: number;
  nazeraCount: number;
  newAdmissionsCount: number;
  collectedFee: number;
  unpaidCount: number;
  collectionPercentage: number;
  expectedFee: number;
  teacherCount: number;
  timeSlotsCount: number;
  classCount: number;
}

interface AttendanceStatus {
  regular: number;
  irregular: number;
  completed: number;
  total: number;
}

interface DashboardStudentClassLevel {
  id: string;
  name: string;
}

interface DashboardStudentTimeSlot {
  id: string;
  label: string;
}

interface DashboardStudentClassSession {
  id: string;
  classLevelId: string;
  timeSlotId: string;
  classLevel?: DashboardStudentClassLevel | null;
  timeSlot?: DashboardStudentTimeSlot | null;
}

interface DashboardStudent {
  id: string;
  studentName: string;
  fatherName?: string | null;
  mobile: string;
  rollNumber?: string | null;
  admissionStatus: AdmissionStatus;
  classSession?: DashboardStudentClassSession | null;
}

interface AdmissionApplicationsResponse {
  data: DashboardStudent[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const ITEMS_PER_PAGE = 5;

import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
  const now = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(null);

  const [applications, setApplications] = useState<DashboardStudent[]>([]);
  const [applicationsPagination, setApplicationsPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);

  const [tableStatusFilter, setTableStatusFilter] = useState<
    'ALL' | AdmissionStatus
  >('ALL');
  const [tableCurrentPage, setTableCurrentPage] = useState(1);
  const [applicationsRefreshKey, setApplicationsRefreshKey] = useState(0);

  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);

  const shortMonth = months[selectedMonth].substring(0, 3);

  // Load overview + attendance when month/year changes
  useEffect(() => {
    let cancelled = false;
    setIsLoadingOverview(true);

    const load = async () => {
      try {
        const [overviewRes, attendanceRes] = await Promise.all([
          apiFetch(
            `/api/dashboard/overview?year=${selectedYear}&month=${selectedMonth}`
          ),
          apiFetch('/api/dashboard/attendencestatus'),
        ]);

        if (!overviewRes.ok) throw new Error('Failed to load overview');
        if (!attendanceRes.ok)
          throw new Error('Failed to load attendance status');

        const overviewJson: DashboardOverview = await overviewRes.json();
        const attendanceJson: AttendanceStatus = await attendanceRes.json();

        if (!cancelled) {
          setOverview(overviewJson);
          setAttendance(attendanceJson);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading dashboard overview:', error);
        }
      } finally {
        if (!cancelled) setIsLoadingOverview(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedMonth]);

  // Load admission applications when filter or page changes
  useEffect(() => {
    let cancelled = false;
    setIsLoadingApplications(true);

    const loadApplications = async () => {
      try {
        const params = new URLSearchParams({
          page: tableCurrentPage.toString(),
          limit: ITEMS_PER_PAGE.toString(),
        });

        if (tableStatusFilter !== 'ALL') {
          params.set('status', tableStatusFilter);
        }

        const res = await apiFetch(
          `/api/dashboard/admissionapplications?${params.toString()}`
        );
        if (!res.ok) throw new Error('Failed to load applications');

        const json: AdmissionApplicationsResponse = await res.json();

        if (!cancelled) {
          setApplications(json.data);
          setApplicationsPagination(json.pagination);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading admission applications:', error);
        }
      } finally {
        if (!cancelled) setIsLoadingApplications(false);
      }
    };

    loadApplications();

    return () => {
      cancelled = true;
    };
  }, [tableCurrentPage, tableStatusFilter, applicationsRefreshKey]);

  const handleStatusChange = async (
    studentId: string,
    newStatus: AdmissionStatus
  ) => {
    try {
      const res = await apiFetch('/api/dashboard/admissionapplications', {
        method: 'PUT',
        body: JSON.stringify({ studentId, status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update admission status');
      }

      // Re-fetch applications after successful update
      setApplicationsRefreshKey((key) => key + 1);
    } catch (error) {
      console.error('Error updating admission status:', error);
    }
  };

  const handleTableStatusFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setTableStatusFilter(e.target.value as 'ALL' | AdmissionStatus);
    setTableCurrentPage(1);
  };

  const totalPages = applicationsPagination?.totalPages ?? 1;
  const totalApplications = applicationsPagination?.total ?? 0;

  const statusPieData = [
    { name: 'Regular', value: attendance?.regular ?? 0, color: '#10b981' },
    { name: 'Irregular', value: attendance?.irregular ?? 0, color: '#f59e0b' },
    { name: 'Completed', value: attendance?.completed ?? 0, color: '#3b82f6' },
  ];

  return (
    <div className='space-y-6'>
      {/* Header & Filter Section */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-bold text-foreground'>
            Dashboard Overview
          </h2>
          <p className='text-primary-200'>
            Key metrics for {months[selectedMonth]} {selectedYear}
          </p>
        </div>
        {/* <div className='p-4'>
          <p className='text-foreground'>This is the default text color.</p>

          <button className='bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded'>
            Primary Button
          </button>

          <div className='mt-4 p-4 bg-primary-50 border border-primary-100 rounded-md'>
            <p className='text-primary-700'>
              This is a notice with a light primary background.
            </p>
          </div>

          <p className='mt-4 text-secondary-500'>
            This text uses the secondary color.
          </p>
        </div> */}

        <div className='flex flex-wrap items-center gap-3'>
          <div className='relative'>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className='h-10 pl-9 pr-4 rounded-lg text-sm border-primary-700 border  outline-none appearance-none cursor-pointer'
            >
              {months.map((m, idx) => (
                <option
                  key={idx}
                  value={idx}
                  className='text-foreground bg-background'
                >
                  {m}
                </option>
              ))}
            </select>
            <Calendar className='w-4 h-4 absolute left-3 top-3 text-primary pointer-events-none' />
          </div>

          <div className='relative'>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className='h-10 pl-9 pr-4 rounded-lg text-sm border-primary-700 border  outline-none appearance-none cursor-pointer'
            >
              {[2023, 2024, 2025, 2026, 2027].map((y) => (
                <option
                  key={y}
                  value={y}
                  className='text-foreground bg-background'
                >
                  {y}
                </option>
              ))}
            </select>
            <Filter className='w-4 h-4 absolute left-3 top-3 text-primary pointer-events-none' />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {/* Card 1: Student Composition */}
        <Card
          variant='neubrutal'
          className='flex flex-col justify-between border-l-4 border-primary'
        >
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-sm font-medium text-gray-500'>
                Total Students
              </p>
              <h3 className='text-3xl font-bold text-foreground  mt-1'>
                {overview?.totalStudents ?? 0}
              </h3>
            </div>
            <div className='p-2 bg-primary-100 dark:bg-primary-900 rounded-lg text-primary-600'>
              <GraduationCap size={20} />
            </div>
          </div>
          <div className='mt-4 flex gap-4 text-xs font-medium text-gray-500'>
            <span className='flex items-center'>
              <span className='w-2 h-2 rounded-full bg-Dashboard Overviewblue-500 mr-1'></span>{' '}
              {overview?.hafizCount ?? 0} Hafiz
            </span>
            <span className='flex items-center'>
              <span className='w-2 h-2 rounded-full bg-purple-500 mr-1'></span>{' '}
              {overview?.nazeraCount ?? 0} Nazera
            </span>
          </div>
        </Card>

        {/* Card 2: Financial Health */}
        <Card
          variant='neubrutal'
          className='flex flex-col justify-between border-l-4 border-green-500'
        >
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-sm font-medium text-gray-500'>
                Revenue ({shortMonth})
              </p>
              <h3 className='text-3xl font-bold text-foreground mt-1'>
                ₹{overview?.collectedFee.toLocaleString() ?? 0}
              </h3>
            </div>
            <div className='p-2 bg-green-100 dark:bg-green-900 rounded-lg text-green-600'>
              <DollarSign size={20} />
            </div>
          </div>
          <div className='mt-3'>
            <div className='flex justify-between text-xs text-gray-500 mb-1'>
              <span>Progress</span>
              <span>{overview?.collectionPercentage ?? 0}% of Exp.</span>
            </div>
            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
              <div
                className='bg-green-500 h-2 rounded-full'
                style={{ width: `${overview?.collectionPercentage ?? 0}%` }}
              ></div>
            </div>
          </div>
        </Card>

        {/* Card 3: Defaulters */}
        <Card
          variant='neubrutal'
          className='flex flex-col justify-between border-l-4 border-red-500'
        >
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-sm font-medium text-gray-500'>
                Unpaid ({shortMonth})
              </p>
              <h3 className='text-3xl font-bold text-red-600 mt-1'>
                {overview?.unpaidCount ?? 0}
              </h3>
            </div>
            <div className='p-2 bg-red-100 dark:bg-red-900 rounded-lg text-red-600'>
              <AlertCircle size={20} />
            </div>
          </div>
          <p className='text-xs text-red-500 mt-2 font-medium'>
            Action Required: Send Reminders
          </p>
        </Card>

        {/* Card 4: Classes */}
        <Card
          variant='neubrutal'
          className='flex flex-col justify-between border-l-4 border-purple-400'
        >
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-sm font-medium text-gray-500'>Total Classes</p>
              <h3 className='text-3xl font-bold text-foreground mt-1'>
                {overview?.classCount ?? 0}
              </h3>
            </div>
            <div className='p-2 bg-purple-100 dark:bg-purple-900 rounded-lg text-purple-500'>
              <BookOpen size={20} />
            </div>
          </div>
          <p className='text-xs text-gray-500 mt-2'>
            In {months[selectedMonth]}{' '}
            {overview?.classCount === 0 && '(Off-Season)'}
          </p>
        </Card>
        <Card
          variant='neubrutal'
          className='flex flex-col justify-between border-l-4 border-yellow-400'
        >
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-sm font-medium text-gray-500'>
                New Admissions
              </p>
              <h3 className='text-3xl font-bold text-foreground mt-1'>
                +{overview?.newAdmissionsCount ?? 0}
              </h3>
            </div>
            <div className='p-2 bg-yellow-100 dark:bg-yellow-500 rounded-lg text-yellow-100'>
              <TrendingUp size={20} />
            </div>
          </div>
          <p className='text-xs text-gray-500 mt-2'>
            In {months[selectedMonth]}{' '}
            {overview?.newAdmissionsCount === 0 && '(Off-Season)'}
          </p>
        </Card>
        <Card
          variant='neubrutal'
          className='flex flex-col justify-between border-l-4 border-blue-400'
        >
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-sm font-medium text-gray-500'>
                Total Teachers
              </p>
              <h3 className='text-3xl font-bold text-foreground mt-1'>
                {overview?.teacherCount ?? 0}
              </h3>
            </div>
            <div className='p-2 bg-blue-100 dark:bg-blue-500 rounded-lg text-blue-900'>
              <Users size={20} />
            </div>
          </div>
          <p className='text-xs text-gray-500 mt-2'>
            In {months[selectedMonth]}{' '}
            {overview?.teacherCount === 0 && '(Off-Season)'}
          </p>
        </Card>
        <Card
          variant='neubrutal'
          className='flex flex-col justify-between border-l-4 border-cyan-400'
        >
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-sm font-medium text-gray-500'>
                Total TimeSlots
              </p>
              <h3 className='text-3xl font-bold text-foreground mt-1'>
                {overview?.timeSlotsCount ?? 0}
              </h3>
            </div>
            <div className='p-2 bg-cyan-500 dark:bg-cyan-100 rounded-lg text-cyan-500'>
              <Clock size={20} />
            </div>
          </div>
          <p className='text-xs text-gray-500 mt-2'>
            In {months[selectedMonth]}{' '}
            {overview?.timeSlotsCount === 0 && '(Off-Season)'}
          </p>
        </Card>
      </div>

      {/* Row 2: Charts and Tables */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
        {/* Attendance Status (Pie Chart) */}
        <Card className='xl:col-span-1'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-bold text-foreground flex items-center'>
              <PieChartIcon size={18} className='mr-2 text-primary-500' />
              Attendance Status
            </h3>
          </div>
          <div className='h-64 w-full flex items-center justify-center'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx='50%'
                  cy='50%'
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey='value'
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    color: '#fff',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign='bottom' height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className='mt-4 space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='flex items-center text-foreground'>
                <span className='w-2 h-2 rounded-full bg-emerald-500 mr-2'></span>
                Regular
              </span>
              <span className='font-semibold'>{attendance?.regular ?? 0}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='flex items-center text-foreground'>
                <span className='w-2 h-2 rounded-full bg-amber-500 mr-2'></span>
                Irregular
              </span>
              <span className='font-semibold'>
                {attendance?.irregular ?? 0}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='flex items-center text-foreground'>
                <span className='w-2 h-2 rounded-full bg-blue-500 mr-2'></span>
                Completed
              </span>
              <span className='font-semibold'>
                {attendance?.completed ?? 0}
              </span>
            </div>
          </div>
        </Card>

        {/* Admission Applications Table */}
        <Card className='xl:col-span-2 flex flex-col h-full overflow-hidden'>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2'>
            <div>
              <h3 className='text-lg font-bold text-foreground'>
                Admission Applications
              </h3>
              <p className='text-xs text-primary-200'>
                Manage pending and recent applications
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <select
                className='text-xs rounded-md border  p-1.5 outline-none bg-background text-foreground focus:border-primary-500'
                value={tableStatusFilter}
                onChange={handleTableStatusFilterChange}
              >
                <option value='ALL'>All Status</option>
                <option value='PENDING'>Pending</option>
                <option value='IN_PROGRESS'>In Progress</option>
                <option value='COMPLETED'>Confirmed</option>
              </select>
              <Badge color='blue'>{totalApplications} Total</Badge>
            </div>
          </div>

          <div className='flex-1 min-h-0'>
            <Table className='border-none shadow-none h-full'>
              <TableHead>
                <TableRow>
                  <Th>Applicant</Th>
                  <Th>Parents Contact</Th>
                  <Th>Proposed Class</Th>
                  <Th>Form Status</Th>
                  <Th>Action</Th>
                </TableRow>
              </TableHead>
              <tbody>
                {applications.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Link href={`/students/${student.id}`} className='group'>
                        <div className='font-medium text-sm text-foreground transition-colors group-hover:text-primary-500'>
                          {student.studentName}
                        </div>
                        {student.rollNumber && (
                          <div className='text-xs text-gray-500 group-hover:text-primary-500 transition-colors'>
                            {student.rollNumber}
                          </div>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium text-foreground'>
                          {student.fatherName ?? '—'}
                        </span>
                        <span className='text-xs text-gray-500 flex items-center mt-0.5'>
                          <Phone size={10} className='mr-1' /> {student.mobile}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col'>
                        <div className='flex items-center text-sm font-medium text-foreground'>
                          <BookOpen
                            size={12}
                            className='mr-1.5 text-primary-500'
                          />
                          {student.classSession?.classLevel?.name ??
                            'Not Assigned'}
                        </div>
                        <div className='flex items-center text-xs text-blue-500 mt-1'>
                          <Clock size={10} className='mr-1' />
                          {student.classSession?.timeSlot?.label ?? '—'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={
                          student.admissionStatus === 'COMPLETED'
                            ? 'green'
                            : student.admissionStatus === 'IN_PROGRESS'
                            ? 'yellow'
                            : 'red'
                        }
                      >
                        {student.admissionStatus === 'COMPLETED'
                          ? 'Confirmed'
                          : student.admissionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <select
                        className={`text-xs border rounded p-1.5 outline-none font-medium cursor-pointer w-32 transition-colors
                          ${
                            student.admissionStatus === 'COMPLETED'
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : student.admissionStatus === 'IN_PROGRESS'
                              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                              : 'bg-white border-gray-300 text-gray-700 focus:border-primary-500'
                          }`}
                        value={student.admissionStatus}
                        onChange={(e) =>
                          handleStatusChange(
                            student.id,
                            e.target.value as AdmissionStatus
                          )
                        }
                      >
                        <option value='PENDING'>Pending</option>
                        <option value='IN_PROGRESS'>In Progress</option>
                        <option value='COMPLETED'>Confirm</option>
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoadingApplications && applications.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='text-center text-gray-500 py-10 text-xs'
                    >
                      No applications found for this filter.
                    </TableCell>
                  </TableRow>
                )}
                {isLoadingApplications && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='text-center text-gray-500 py-10 text-xs'
                    >
                      Loading applications...
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className='bg-background px-4 py-3 flex items-center justify-between border-t border-gray-200 mt-auto'>
              <div className='text-xs text-gray-700 dark:text-gray-400'>
                Showing{' '}
                <span className='font-medium'>
                  {(tableCurrentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{' '}
                to{' '}
                <span className='font-medium'>
                  {Math.min(
                    tableCurrentPage * ITEMS_PER_PAGE,
                    totalApplications
                  )}
                </span>{' '}
                of <span className='font-medium'>{totalApplications}</span>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outlined'
                  size='sm'
                  disabled={tableCurrentPage === 1}
                  onClick={() => setTableCurrentPage((p) => p - 1)}
                  className='px-2 cursor-pointer'
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant='outlined'
                  size='sm'
                  disabled={tableCurrentPage === totalPages}
                  onClick={() => setTableCurrentPage((p) => p + 1)}
                  className='px-2 cursor-pointer'
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
}
