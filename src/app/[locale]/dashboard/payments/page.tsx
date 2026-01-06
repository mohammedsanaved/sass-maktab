'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  TableCell,
  Select,
  Modal,
  Card,
} from '@/components/ui';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

// Define interfaces based on API response
interface StudentPaymentInfo {
  id: string;
  rollNumber: string;
  studentName: string;
  fatherName: string;
  monthlyFees: number;
  lastFeePaidMonth: string | null;
  classSession: {
    classLevelName: string;
  } | null;
}

interface ClassLevel {
  id: string;
  name: string;
}

interface TimeSlot {
  id: string;
  label: string;
}

import { apiFetch } from '@/lib/api';

const PaymentsPage = () => {
  const [students, setStudents] = useState<StudentPaymentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering and Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [timeSlotId, setTimeSlotId] = useState('');
  const [status, setStatus] = useState('ALL'); // 'ALL', 'PAID', 'UNPAID'

  // Dropdown options
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentPaymentInfo | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMonths, setPaymentMonths] = useState<string[]>([]);
  const [paymentRemarks, setPaymentRemarks] = useState('');

  // Fetch student payment data
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      search,
      ...(classId && { classId }),
      ...(timeSlotId && { timeSlotId }),
      ...(status !== 'ALL' && { status }),
    });

    try {
      const response = await apiFetch(`/api/payments?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment data');
      }
      const data = await response.json();
      setStudents(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, classId, timeSlotId, status]);

  // Fetch dropdown data
  const fetchFilters = useCallback(async () => {
    try {
      const [classesRes, timeslotsRes] = await Promise.all([
        apiFetch('/api/settings/classes'),
        apiFetch('/api/settings/timeslots'),
      ]);
      if (classesRes.ok) setClassLevels(await classesRes.json());
      if (timeslotsRes.ok) setTimeSlots(await timeslotsRes.json());
    } catch (err) {
      console.error('Failed to fetch filter options');
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  const handlePayFees = (student: StudentPaymentInfo) => {
    setSelectedStudent(student);
    setPaymentAmount(student.monthlyFees.toString());
    setPaymentMonths([]);
    setPaymentRemarks('');
    setIsModalOpen(true);
  };

  const handleSavePayment = async () => {
    if (!selectedStudent || !paymentAmount || paymentMonths.length === 0) {
      alert('Please fill all required fields.');
      return;
    }

    try {
      const response = await apiFetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedStudent.id,
          amount: parseFloat(paymentAmount),
          months: paymentMonths,
          remarks: paymentRemarks,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment failed');
      }

      // Success
      setIsModalOpen(false);
      fetchStudents(); // Refresh the list
      alert('Payment successful!');
      // TODO: Show receipt option
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Helper to determine payment status
  const getPaymentStatus = (lastPaid: string | null): 'PAID' | 'UNPAID' => {
    if (!lastPaid) return 'UNPAID';
    const lastPaidDate = new Date(lastPaid);
    const currentDate = new Date();
    return lastPaidDate.getFullYear() > currentDate.getFullYear() ||
      (lastPaidDate.getFullYear() === currentDate.getFullYear() &&
        lastPaidDate.getMonth() >= currentDate.getMonth())
      ? 'PAID'
      : 'UNPAID';
  };

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>Fee Payments</h1>

      {/* Filters */}
      <Card className='mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <TextField
            icon={Search}
            label='Search by name or roll no...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            options={[
              { value: '', label: 'All Classes' },
              ...classLevels.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <Select
            value={timeSlotId}
            onChange={(e) => setTimeSlotId(e.target.value)}
            options={[
              { value: '', label: 'All Time Slots' },
              ...timeSlots.map((t) => ({ value: t.id, label: t.label })),
            ]}
          />
          <div className='flex items-center space-x-2'>
            <Button
              variant={status === 'ALL' ? 'contained' : 'outlined'}
              onClick={() => setStatus('ALL')}
            >
              All
            </Button>
            <Button
              variant={status === 'PAID' ? 'contained' : 'outlined'}
              color='success'
              onClick={() => setStatus('PAID')}
            >
              Paid
            </Button>
            <Button
              variant={status === 'UNPAID' ? 'contained' : 'outlined'}
              color='danger'
              onClick={() => setStatus('UNPAID')}
            >
              Unpaid
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className='text-red-500'>{error}</p>
      ) : (
        <Card className='p-0 overflow-hidden'>
          <Table>
            <TableHead>
              <TableRow>
                <Th>Roll No</Th>
                <Th>Student Name</Th>
                <Th>Father Name</Th>
                <Th>Class</Th>
                <Th>Monthly Fees</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => {
                const paymentStatus = getPaymentStatus(student.lastFeePaidMonth);
                return (
                  <TableRow key={student.id}>
                    <TableCell>{student.rollNumber}</TableCell>
                    <TableCell>{student.studentName}</TableCell>
                    <TableCell>{student.fatherName}</TableCell>
                    <TableCell>
                      {student.classSession?.classLevelName || 'N/A'}
                    </TableCell>
                    <TableCell>₹{student.monthlyFees}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button size='sm' onClick={() => handlePayFees(student)}>
                        Pay Fees
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination Controls */}
      {/* <div className='flex justify-between items-center mt-6'>
        <Button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
          Previous
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div> */}
      <div className="px-6 py-4 flex items-center justify-between">
            {/* <span className="text-sm text-gray-500">
                Showing {Math.min(students.length, (page - 1) * itemsPerPage + 1)} to {Math.min(students.length, page * itemsPerPage)} of {students.length} students
            </span> */}
            <span className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </span>
            <div className="flex gap-2">
                <Button variant="outlined" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft size={16} />
                </Button>
                <Button variant="outlined" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight size={16} />
                </Button>
            </div>
        </div>

      {/* Pay Fees Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Pay Fees for ${selectedStudent?.studentName}`}
      >
        <div className='space-y-4'>
          <TextField
            label='Amount'
            type='number'
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
          />
          <TextField
            label='Remarks'
            value={paymentRemarks}
            onChange={(e) => setPaymentRemarks(e.target.value)}
          />
          {/* Month selection could be a component with checkboxes for the year */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Select Months
            </label>
            <div className='grid grid-cols-3 gap-2'>
              {Array.from({ length: 12 }, (_, i) => new Date(0, i)).map((d) => (
                <Button
                  key={d.getMonth()}
                  variant={
                    paymentMonths.includes(d.toISOString().substring(0, 7))
                      ? 'contained'
                      : 'outlined'
                  }
                  onClick={() => {
                    const monthStr = d.toISOString().substring(0, 7);
                    setPaymentMonths((prev) =>
                      prev.includes(monthStr)
                        ? prev.filter((m) => m !== monthStr)
                        : [...prev, monthStr]
                    );
                  }}
                >
                  {d.toLocaleString('default', { month: 'short' })}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className='mt-6 flex justify-end gap-3'>
          <Button variant='text' onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSavePayment}>Save Payment</Button>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentsPage;
