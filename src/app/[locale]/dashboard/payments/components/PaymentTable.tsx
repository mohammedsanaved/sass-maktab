import React from 'react';
import Link from 'next/link';
import { Card, Table, TableHead, TableBody, TableRow, Th, TableCell, Button } from '@/components/ui';
import { formatMonth, formatDate } from '@/lib/utils/date-utils';
import { StudentPaymentInfo } from '../types';

interface PaymentTableProps {
  students: StudentPaymentInfo[];
  onPayFees: (student: StudentPaymentInfo) => void;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({ students, onPayFees }) => {
  return (
    <Card className='p-0 overflow-hidden'>
      <Table>
        <TableHead>
          <TableRow>
            <Th>Roll No</Th>
            <Th>Candidate Name</Th>
            <Th>Contact</Th>
            <Th>Arrears</Th>
            <Th>Monthly Fee</Th>
            <Th>Last Paid Months</Th>
            <Th>Action</Th>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student) => {
            const freeCategory =
              student.feeCategory !== 'ORPHAN' &&
              student.feeCategory !== 'SCHOLARSHIP';
            return (
              <TableRow key={student.id}>
                <TableCell>{student.rollNumber}</TableCell>
                <TableCell>
                  {freeCategory ? (
                    <Link
                      href={`/dashboard/payments/${student.id}`}
                      className='text-primary-600 hover:text-primary-800 hover:underline font-medium'
                    >
                      {student.studentName} {student.fatherName}
                    </Link>
                  ) : (
                    <span>
                      {student.studentName} {student.fatherName}
                    </span>
                  )}
                </TableCell>
                <TableCell>{student.mobile}</TableCell>
                <TableCell>
                  {student.arrears.months > 0 ? (
                    <span className='text-red-600 font-bold'>
                      {student.arrears.months} m (₹{student.arrears.amount})
                    </span>
                  ) : (
                    <span className='text-green-600'>No Arrears</span>
                  )}
                </TableCell>
                <TableCell>₹{student.monthlyFees}</TableCell>
                <TableCell>
                  {student.latestPayment &&
                  student.latestPayment.paidMonths.length > 0 ? (
                    <div className='flex flex-col'>
                      <span className='text-sm text-foreground'>
                        {student.latestPayment.paidMonths.length > 3
                          ? `${formatMonth(student.latestPayment.paidMonths.sort()[0])} - ${formatMonth(student.latestPayment.paidMonths.sort()[student.latestPayment.paidMonths.length - 1])}`
                          : student.latestPayment.paidMonths
                              .map(formatMonth)
                              .join(', ')}
                      </span>
                      <span className='text-xs text-gray-500'>
                        ₹{student.latestPayment.amount} on{' '}
                        {formatDate(student.latestPayment.paymentDate)}
                      </span>
                    </div>
                  ) : (
                    <span className='text-sm text-gray-400 italic'>
                      No payments yet
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    {freeCategory && (
                      <Button
                        size='sm'
                        className='hover:bg-primary-500 hover:text-white transition-colors duration-300 cursor-pointer'
                        onClick={() => onPayFees(student)}
                      >
                        Pay Fees
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
};
