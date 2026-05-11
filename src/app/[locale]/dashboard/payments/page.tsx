'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';

import { useDebounce } from '@/hooks/useDebounce';
import { apiFetch } from '@/lib/api';
import { getMonthStr } from '@/lib/utils/date-utils';

import { StudentPaymentInfo, ClassLevel, TimeSlot, ClassSession } from './types';
import { PaymentFilters } from './components/PaymentFilters';
import { PaymentTable } from './components/PaymentTable';
import { PayFeeModal } from './components/PayFeeModal';

const PaymentsPage = () => {
  const [students, setStudents] = useState<StudentPaymentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering and Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [classId, setClassId] = useState('');
  const [timeSlotId, setTimeSlotId] = useState('');
  const [classSessionId, setClassSessionId] = useState('');
  const [status, setStatus] = useState('ALL');

  // Print Logic
  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: contentRef,
  });

  const [lastPaymentData, setLastPaymentData] = useState<any>(null);
  const [showPrintButton, setShowPrintButton] = useState(false);

  // Dropdown options
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availableSessions, setAvailableSessions] = useState<ClassSession[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentPaymentInfo | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMonths, setPaymentMonths] = useState<string[]>([]);
  const [paymentRemarks, setPaymentRemarks] = useState('');

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(classId && { classId }),
      ...(timeSlotId && { timeSlotId }),
      ...(classSessionId && { classSessionId }),
      ...(status !== 'ALL' && { status }),
    });

    try {
      const response = await apiFetch(`/api/payments?${params}`);
      if (!response.ok) throw new Error('Failed to fetch payment data');
      const data = await response.json();
      setStudents(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total || 0);
    } catch (err: any) {
      setError(err.message);
      toast.error('Error fetching students');
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, classId, timeSlotId, classSessionId, status]);

  const fetchFilters = useCallback(async () => {
    try {
      const [classesRes, timeslotsRes, sessionsRes] = await Promise.all([
        apiFetch('/api/settings/classes'),
        apiFetch('/api/settings/timeslots'),
        apiFetch('/api/settings/class-sessions'),
      ]);
      if (classesRes.ok) setClassLevels(await classesRes.json());
      if (timeslotsRes.ok) setTimeSlots(await timeslotsRes.json());
      if (sessionsRes.ok) setAvailableSessions(await sessionsRes.json());
    } catch (err) {
      console.error('Failed to fetch filter options');
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { fetchFilters(); }, [fetchFilters]);

  const handlePayFees = (student: StudentPaymentInfo) => {
    setSelectedStudent(student);
    const pendingMonths: string[] = [];
    const arrearsStartDate = new Date(2025, 6, 1);
    const joinDate = new Date(student.joinedAt);
    const lastPaid = student.lastFeePaidMonth ? new Date(student.lastFeePaidMonth) : null;

    let current = lastPaid
      ? new Date(lastPaid.getFullYear(), lastPaid.getMonth() + 1, 1)
      : joinDate > arrearsStartDate ? new Date(joinDate.getFullYear(), joinDate.getMonth(), 1) : arrearsStartDate;

    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);

    while (current <= today) {
      pendingMonths.push(getMonthStr(current));
      current.setMonth(current.getMonth() + 1);
    }

    setPaymentMonths(pendingMonths);
    setPaymentAmount((pendingMonths.length * student.monthlyFees).toString());
    setPaymentRemarks('');
    setIsModalOpen(true);
  };

  const handleSavePayment = async () => {
    if (!selectedStudent || !paymentAmount || paymentMonths.length === 0) {
      toast.error('Please fill all required fields.');
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

      if (!response.ok) throw new Error('Payment failed');

      const paymentResponse = await response.json();
      setLastPaymentData({
        ...selectedStudent,
        amount: parseFloat(paymentAmount),
        months: paymentMonths,
        receiptNo: paymentResponse.receiptNo,
        id: paymentResponse.id,
        classLevelName: selectedStudent.classSession?.classLevelName || 'N/A',
      });

      setShowPrintButton(true);
      fetchStudents();
      toast.success('Payment successful!');
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
    }
  };

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>Fee Payments</h1>

      <PaymentFilters
        search={search}
        setSearch={setSearch}
        classId={classId}
        setClassId={setClassId}
        timeSlotId={timeSlotId}
        setTimeSlotId={setTimeSlotId}
        classSessionId={classSessionId}
        setClassSessionId={setClassSessionId}
        classLevels={classLevels}
        timeSlots={timeSlots}
        availableSessions={availableSessions}
      />

      {isLoading ? (
        <div className='flex h-96 items-center justify-center'>
          <Loader2 className='animate-spin text-primary-500' size={40} />
        </div>
      ) : error ? (
        <div className='p-8 text-center'>
          <p className='text-red-500 font-medium'>{error}</p>
          <Button variant='outlined' className='mt-4' onClick={fetchStudents}>Retry</Button>
        </div>
      ) : (
        <PaymentTable students={students} onPayFees={handlePayFees} />
      )}

      <div className='px-6 py-4 flex items-center justify-between'>
        <span className='text-sm text-gray-500'>
          Showing {students.length > 0 ? (page - 1) * 10 + 1 : 0} - {Math.min(page * 10, total)} of {total} students
        </span>
        <div className='flex items-center gap-4'>
          <span className='text-sm text-gray-500'>Page {page} of {totalPages}</span>
          <div className='flex gap-2'>
            <Button
              variant='outlined'
              size='sm'
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant='outlined'
              size='sm'
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      <PayFeeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setShowPrintButton(false);
          setLastPaymentData(null);
        }}
        selectedStudent={selectedStudent}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentMonths={paymentMonths}
        setPaymentMonths={setPaymentMonths}
        paymentRemarks={paymentRemarks}
        setPaymentRemarks={setPaymentRemarks}
        onSavePayment={handleSavePayment}
        showPrintButton={showPrintButton}
        setShowPrintButton={setShowPrintButton}
        lastPaymentData={lastPaymentData}
        handlePrint={handlePrint}
        contentRef={contentRef}
      />
    </div>
  );
};

export default PaymentsPage;
