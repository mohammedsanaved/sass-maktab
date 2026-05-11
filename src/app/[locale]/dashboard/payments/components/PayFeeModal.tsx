import React from 'react';
import { Modal, Button, TextField } from '@/components/ui';
import { Printer } from 'lucide-react';
import { Receipt } from '@/components/Receipt';
import { getMonthStr } from '@/lib/utils/date-utils';
import { StudentPaymentInfo } from '../types';

interface PayFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudent: StudentPaymentInfo | null;
  paymentAmount: string;
  setPaymentAmount: (value: string) => void;
  paymentMonths: string[];
  setPaymentMonths: React.Dispatch<React.SetStateAction<string[]>>;
  paymentRemarks: string;
  setPaymentRemarks: (value: string) => void;
  onSavePayment: () => void;
  showPrintButton: boolean;
  setShowPrintButton: (value: boolean) => void;
  lastPaymentData: any;
  handlePrint: () => void;
  contentRef: React.RefObject<HTMLDivElement>;
}

export const PayFeeModal: React.FC<PayFeeModalProps> = ({
  isOpen,
  onClose,
  selectedStudent,
  paymentAmount,
  setPaymentAmount,
  paymentMonths,
  setPaymentMonths,
  paymentRemarks,
  setPaymentRemarks,
  onSavePayment,
  showPrintButton,
  setShowPrintButton,
  lastPaymentData,
  handlePrint,
  contentRef,
}) => {
  const getSelectableMonths = () => {
    if (!selectedStudent) return [];

    const arrearsStartDate = new Date(2025, 6, 1);
    const joinDate = new Date(selectedStudent.joinedAt);
    const lastPaid = selectedStudent.lastFeePaidMonth
      ? new Date(selectedStudent.lastFeePaidMonth)
      : null;

    let current = lastPaid
      ? new Date(lastPaid.getFullYear(), lastPaid.getMonth() + 1, 1)
      : joinDate > arrearsStartDate
        ? new Date(joinDate.getFullYear(), joinDate.getMonth(), 1)
        : arrearsStartDate;

    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 2);
    endDate.setMonth(11);

    const months = [];
    while (current <= endDate) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const toggleMonth = (monthStr: string) => {
    setPaymentMonths((prev) => {
      const newMonths = prev.includes(monthStr)
        ? prev.filter((m) => m !== monthStr)
        : [...prev, monthStr].sort();

      if (selectedStudent) {
        setPaymentAmount(
          (newMonths.length * selectedStudent.monthlyFees).toString(),
        );
      }
      return newMonths;
    });
  };

  const selectableMonths = getSelectableMonths();
  const monthsByYear: Record<number, Date[]> = {};
  selectableMonths.forEach((m) => {
    const year = m.getFullYear();
    if (!monthsByYear[year]) monthsByYear[year] = [];
    monthsByYear[year].push(m);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        showPrintButton
          ? `Payment Successful`
          : `Pay Fees for ${selectedStudent?.studentName}`
      }
    >
      {showPrintButton ? (
        <div className='flex flex-col items-center justify-center py-8 space-y-6'>
          <div className='w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center'>
            <Printer size={32} />
          </div>
          <div className='text-center'>
            <h3 className='text-xl font-bold'>Transaction Complete</h3>
            <p className='text-gray-500'>
              Fees for {selectedStudent?.studentName} recorded.
            </p>
          </div>

          <div className='flex gap-4'>
            <Button onClick={() => handlePrint()} color='success'>
              <Printer size={18} className='mr-2' /> Print Receipt
            </Button>
            <Button
              variant='outlined'
              onClick={onClose}
            >
              Done
            </Button>
          </div>

          <div style={{ display: 'none' }}>
            <Receipt ref={contentRef} data={lastPaymentData} />
          </div>
        </div>
      ) : (
        <>
          <div className='space-y-6'>
            {selectedStudent && selectedStudent.arrears.months > 0 && (
              <div className='bg-red-50 border border-red-200 p-4 rounded-lg'>
                <p className='text-red-800 font-bold text-sm'>
                  TOTAL ARREARS: {selectedStudent.arrears.months} Months (₹
                  {selectedStudent.arrears.amount})
                </p>
                <p className='text-red-600 text-[10px] uppercase font-bold mt-1'>
                  Starting from July 2025 or join date
                </p>
              </div>
            )}

            <div className='grid grid-cols-2 gap-4'>
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
                placeholder='Optional'
              />
            </div>

            <div>
              <label className='block text-sm font-bold uppercase tracking-wider text-gray-500 mb-4'>
                Select Months (Up to 2 Years Advance)
              </label>
              <div className='max-h-72 overflow-y-auto pr-2 space-y-6 custom-scrollbar'>
                {Object.keys(monthsByYear)
                  .sort()
                  .map((year) => (
                    <div key={year} className='space-y-3'>
                      <h4 className='text-xs font-black text-primary-600 border-b pb-1'>
                        {year}
                      </h4>
                      <div className='grid grid-cols-4 gap-2'>
                        {monthsByYear[parseInt(year)].map((d) => {
                          const monthStr = getMonthStr(d);
                          const isSelected = paymentMonths.includes(monthStr);
                          return (
                            <Button
                              key={monthStr}
                              variant={isSelected ? 'contained' : 'outlined'}
                              size='sm'
                              className='text-[10px] py-1 px-0'
                              onClick={() => toggleMonth(monthStr)}
                            >
                              {d.toLocaleString('default', {
                                month: 'short',
                              })}
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
              <p className='text-xs text-gray-400'>Selected Months:</p>
              <p className='font-bold text-lg text-primary-600'>
                {paymentMonths.length} Months
              </p>
            </div>
            <div className='flex gap-3'>
              <Button
                variant='outlined'
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button onClick={onSavePayment}>
                Confirm Payment (₹{paymentAmount})
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};
