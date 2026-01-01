'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';

// Define the shape of the receipt data
interface ReceiptData {
  receiptNo: string;
  date: string;
  amount: number;
  remarks: string;
  student: {
    name: string;
    rollNumber: string;
    fatherName: string;
    mobile: string;
    class: string;
    section: string;
    timeSlot: string;
  };
}

const ReceiptPage = () => {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const studentId = searchParams.get('studentId');

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId && !studentId) {
      setError('No payment or student specified.');
      setIsLoading(false);
      return;
    }

    const fetchReceipt = async () => {
      try {
        const params = new URLSearchParams(
          paymentId ? { paymentId } : { studentId: studentId! }
        );

        const response = await fetch(`/api/payments/receipt?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch receipt data');
        }
        const data = await response.json();
        setReceipt(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceipt();
  }, [paymentId, studentId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <p className='text-center mt-10'>Loading Receipt...</p>;
  if (error)
    return <p className='text-center mt-10 text-red-500'>Error: {error}</p>;
  if (!receipt) return <p className='text-center mt-10'>Receipt not found.</p>;

  return (
    <div className='max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-md print:shadow-none'>
      {/* Header */}
      <div className='flex justify-between items-center border-b pb-4 mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>Fee Receipt</h1>
          <p className='text-gray-500'>Madarsa Name</p>
          {/* TODO: make dynamic */}
        </div>
        <div className='text-right'>
          <p className='font-semibold'>Receipt No: {receipt.receiptNo}</p>
          <p className='text-sm text-gray-600'>
            Date: {new Date(receipt.date).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Student Details */}
      <div className='mb-6'>
        <h2 className='text-xl font-semibold mb-2'>Student Information</h2>
        <div className='grid grid-cols-2 gap-x-8 gap-y-2 text-gray-700'>
          <p>
            <strong>Name:</strong> {receipt.student.name}
          </p>
          <p>
            <strong>Roll Number:</strong> {receipt.student.rollNumber}
          </p>
          <p>
            <strong>Father&apos;s Name:</strong> {receipt.student.fatherName}
          </p>
          <p>
            <strong>Class:</strong>{' '}
            {`${receipt.student.class} (${receipt.student.timeSlot})`}
          </p>
        </div>
      </div>

      {/* Payment Details */}
      <div>
        <h2 className='text-xl font-semibold mb-2'>Payment Details</h2>
        <table className='w-full text-left table-auto'>
          <thead>
            <tr className='bg-gray-100'>
              <th className='p-3 font-semibold'>Description</th>
              <th className='p-3 font-semibold text-right'>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className='border-b'>
              <td className='p-3'>
                {receipt.remarks || 'Monthly Tuition Fee'}
              </td>
              <td className='p-3 text-right'>₹{receipt.amount.toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className='font-bold'>
              <td className='p-3 text-right'>Total Paid</td>
              <td className='p-3 text-right text-xl'>
                ₹{receipt.amount.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer & Print */}
      <div className='mt-8 text-center print:hidden'>
        <p className='text-gray-500 text-sm mb-4'>
          Thank you for your payment.
        </p>
        <Button onClick={handlePrint}>Print Receipt</Button>
      </div>
    </div>
  );
};

export default ReceiptPage;
