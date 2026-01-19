'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Table, TableHead, TableBody, TableRow, Th, TableCell, TextField } from '@/components/ui';
import { ChevronLeft, Printer, Search, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from '@/components/Receipt';
import { useDebounce } from '@/hooks/useDebounce';

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentType: string;
  paidMonths: string[];
  remarks: string | null;
  receiptNo: string | null;
}

interface StudentDetails {
  id: string;
  studentName: string;
  fatherName: string;
  rollNumber: string;
  monthlyFees: number;
  lastFeePaidMonth: string | null;
  joinedAt: string;
  classLevelName: string;
}

const StudentPaymentHistoryParams = ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = use(params);
    const router = useRouter();
    const [student, setStudent] = useState<StudentDetails | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination & Search
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);

    // Print State
    const [printData, setPrintData] = useState<any>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: contentRef,
    });

    const fetchHistory = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...(debouncedSearch && { search: debouncedSearch }),
            });
            
            const response = await apiFetch(`/api/payments/student/${id}?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch payment history');
            }
            const data = await response.json();
            setStudent(data.student);
            setPayments(data.payments);
            setTotal(data.pagination.total);
            setTotalPages(data.pagination.totalPages);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [id, page, debouncedSearch]);


    useEffect(() => {
        if (id) {
            fetchHistory();
        }
    }, [id, fetchHistory]);

    // Handle Print Click
    const onPrintClick = (payment: Payment) => {
        if (!student) return;

        setPrintData({
            id: payment.receiptNo || payment.id, // Use receiptNo if available for display
            studentName: student.studentName,
            fatherName: student.fatherName,
            rollNumber: student.rollNumber,
            classLevelName: student.classLevelName,
            amount: payment.amount,
            months: payment.paidMonths,
            paymentDate: payment.paymentDate,
        });
        
        // Slight delay to allow state to update before printing
        setTimeout(() => {
            handlePrint();
        }, 100);
    };


    const formatMonth = (monthStr: string) => {
        try {
            const [year, month] = monthStr.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            return format(date, 'MMM yyyy');
        } catch {
            return monthStr;
        }
    };

    if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outlined" size="sm" onClick={() => router.back()}>
                    <ChevronLeft size={16} className="mr-1" />
                </Button>
                <div>
                   <h1 className="text-2xl font-bold">Payment History</h1>
                   {student && (
                       <p className="text-gray-500">{student.studentName} {student.fatherName} ({student.rollNumber})</p>
                   )}
                </div>
            </div>

            <Card>
                <div className="mb-4 flex justify-between items-center">
                    <div className="w-1/3">
                        <TextField
                        label='Receipt No'
                            icon={Search}
                            placeholder="Search by Receipt No..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>

                <Table>
                    <TableHead>
                        <TableRow>
                            <Th>Receipt No</Th>
                            <Th>Payment Date</Th>
                            <Th>Amount</Th>
                            <Th>Paid Months</Th>
                            <Th>Remarks</Th>
                            <Th>Actions</Th>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                             <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                            </TableRow>
                        ) : payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-gray-400 italic">
                                    No records found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-mono text-xs text-gray-500">
                                        {payment.receiptNo || payment.id.slice(-6).toUpperCase()}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(payment.paymentDate), 'dd MMM yyyy')}
                                    </TableCell>
                                    <TableCell className="font-bold text-green-700">
                                        ₹{payment.amount}
                                    </TableCell>
                                    <TableCell>
                                        <div className="max-w-xs flex flex-wrap gap-1">
                                            {payment.paidMonths && payment.paidMonths.length > 0 ? (
                                                payment.paidMonths.length > 3 ? (
                                                     <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                                        {formatMonth(payment.paidMonths.sort()[0])} - {formatMonth(payment.paidMonths.sort()[payment.paidMonths.length - 1])}
                                                     </span>
                                                ) : (
                                                    payment.paidMonths.sort().map(m => (
                                                        <span key={m} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                                            {formatMonth(m)}
                                                        </span>
                                                    ))
                                                )
                                            ) : '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {payment.remarks || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Button size="sm" variant="outlined" onClick={() => onPrintClick(payment)}>
                                            <Printer size={14} className="mr-1"/> Receipt
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                 <div className="px-6 py-4 flex items-center justify-between border-t mt-4">
                    <span className="text-sm text-gray-500">
                        Showing {payments.length > 0 ? (page - 1) * 10 + 1 : 0} - {Math.min(page * 10, total)} of {total} records
                    </span>
                    <div className="flex items-center gap-4">
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
                </div>
            </Card>

             {/* Hidden Receipt Component for Printing */}
             <div style={{ display: 'none' }}>
                <Receipt ref={contentRef} data={printData} />
            </div>
        </div>
    );
};

export default StudentPaymentHistoryParams;
