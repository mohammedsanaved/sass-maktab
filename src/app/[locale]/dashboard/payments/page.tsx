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
  mobile: string;
  monthlyFees: number;
  lastFeePaidMonth: string | null;
  joinedAt: string;
  arrears: {
    months: number;
    amount: number;
  };
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
      console.log(data, "dataPayments");
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

  // Generate selectable months (Current Year + 2)
  const getSelectableMonths = () => {
    if (!selectedStudent) return [];
    
    // Start from Max(July 2025, lastPaid + 1, joinDate)
    const arrearsStartDate = new Date(2025, 6, 1);
    const joinDate = new Date(selectedStudent.joinedAt);
    const lastPaid = selectedStudent.lastFeePaidMonth ? new Date(selectedStudent.lastFeePaidMonth) : null;
    
    let current = lastPaid ? new Date(lastPaid.getFullYear(), lastPaid.getMonth() + 1, 1) : 
                (joinDate > arrearsStartDate ? new Date(joinDate.getFullYear(), joinDate.getMonth(), 1) : arrearsStartDate);
    
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 2);
    endDate.setMonth(11); // Dec of 2 years ahead

    const months = [];
    while (current <= endDate) {
        months.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const handlePayFees = (student: StudentPaymentInfo) => {
    setSelectedStudent(student);
    
    // Auto-select pending months (Arrears + Current Month)
    const pendingMonths: string[] = [];
    const arrearsStartDate = new Date(2025, 6, 1);
    const joinDate = new Date(student.joinedAt);
    const lastPaid = student.lastFeePaidMonth ? new Date(student.lastFeePaidMonth) : null;
    
    let current = lastPaid ? new Date(lastPaid.getFullYear(), lastPaid.getMonth() + 1, 1) : 
                (joinDate > arrearsStartDate ? new Date(joinDate.getFullYear(), joinDate.getMonth(), 1) : arrearsStartDate);
    
    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);

    while (current <= today) {
        pendingMonths.push(current.toISOString().substring(0, 7));
        current.setMonth(current.getMonth() + 1);
    }

    setPaymentMonths(pendingMonths);
    setPaymentAmount((pendingMonths.length * student.monthlyFees).toString());
    setPaymentRemarks('');
    setIsModalOpen(true);
  };

  const toggleMonth = (monthStr: string) => {
    setPaymentMonths(prev => {
        const newMonths = prev.includes(monthStr) 
            ? prev.filter(m => m !== monthStr)
            : [...prev, monthStr].sort();
        
        if (selectedStudent) {
            setPaymentAmount((newMonths.length * selectedStudent.monthlyFees).toString());
        }
        return newMonths;
    });
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

      setIsModalOpen(false);
      setPaymentAmount('');
      setPaymentMonths([]);
      setPaymentRemarks('');
      fetchStudents();
      alert('Payment successful!');
    } catch (err: any) {
      setError(err.message);
    }
  };


  const selectableMonths = getSelectableMonths();
  const monthsByYear: Record<number, Date[]> = {};
  selectableMonths.forEach(m => {
      const year = m.getFullYear();
      if (!monthsByYear[year]) monthsByYear[year] = [];
      monthsByYear[year].push(m);
  });

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>Fee Payments</h1>

      {/* Filters */}
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
                <Th>Candidate Name</Th>
                <Th>Contact</Th>
                <Th>Arrears</Th>
                <Th>Monthly Fee</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => {
                const paymentStatus = student.arrears.months === 0 ? 'PAID' : 'UNPAID';
                return (
                  <TableRow key={student.id}>
                    <TableCell>{student.rollNumber}</TableCell>
                    <TableCell>{student.studentName}{" "}{student.fatherName}</TableCell>
                    <TableCell>{student.mobile}</TableCell>
                    <TableCell>
                        {student.arrears.months > 0 ? (
                            <span className="text-red-600 font-bold">
                                {student.arrears.months} m (₹{student.arrears.amount})
                            </span>
                        ) : (
                            <span className="text-green-600">No Arrears</span>
                        )}
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
                      {paymentStatus === 'UNPAID' && (
                        <Button size='sm' onClick={() => handlePayFees(student)}>
                            Pay Fees
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="px-6 py-4 flex items-center justify-between">
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
        <div className='space-y-6'>
          {selectedStudent && selectedStudent.arrears.months > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-red-800 font-bold text-sm">TOTAL ARREARS: {selectedStudent.arrears.months} Months (₹{selectedStudent.arrears.amount})</p>
                  <p className="text-red-600 text-[10px] uppercase font-bold mt-1">Starting from July 2025 or join date</p>
              </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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
                placeholder="Optional"
            />
          </div>

          <div>
            <label className='block text-sm font-bold uppercase tracking-wider text-gray-500 mb-4'>
              Select Months (Up to 2 Years Advance)
            </label>
            <div className='max-h-72 overflow-y-auto pr-2 space-y-6 custom-scrollbar'>
              {Object.keys(monthsByYear).sort().map((year) => (
                  <div key={year} className="space-y-3">
                      <h4 className="text-xs font-black text-primary-600 border-b pb-1">{year}</h4>
                      <div className='grid grid-cols-4 gap-2'>
                        {monthsByYear[parseInt(year)].map((d) => {
                            const monthStr = d.toISOString().substring(0, 7);
                            const isSelected = paymentMonths.includes(monthStr);
                            return (
                                <Button
                                    key={monthStr}
                                    variant={isSelected ? 'contained' : 'outlined'}
                                    size="sm"
                                    className="text-[10px] py-1 px-0"
                                    onClick={() => toggleMonth(monthStr)}
                                >
                                    {d.toLocaleString('default', { month: 'short' })}
                                </Button>
                            );
                        })}
                      </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
        <div className='mt-8 pt-4 border-t flex justify-between items-center'>
          <div>
              <p className="text-xs text-gray-400">Selected Months:</p>
              <p className="font-bold text-lg text-primary-600">{paymentMonths.length} Months</p>
          </div>
          <div className="flex gap-3">
            <Button variant='outlined' onClick={() => setIsModalOpen(false)}>
                Cancel
            </Button>
            <Button onClick={handleSavePayment}>Confirm Payment (₹{paymentAmount})</Button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #ccc;
              border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #aaa;
          }
      `}</style>
    </div>
  );
};

export default PaymentsPage;
