import React, { useState, useMemo } from 'react';
import { Card, Button, TableContainer, TableHead, TableRow, TableHeaderCell, TableCell, Badge, Modal, TextField, Checkbox } from '../components/ui';
import { studentsData as initialStudents, classLevels, timeSlots } from '../services/mockData';
import { Printer, CheckCircle, XCircle, Phone, Search, ChevronLeft, ChevronRight, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { Student } from '../types';

interface MonthSelection {
  id: string; // YYYY-MM
  label: string;
  year: number;
  month: number;
  amount: number;
  isArrear: boolean;
}

export const Payments = () => {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterTimeSlot, setFilterTimeSlot] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedStudentForReceipt, setSelectedStudentForReceipt] = useState<Student | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{ student: Student, availableMonths: MonthSelection[] } | null>(null);
  const [selectedMonthIds, setSelectedMonthIds] = useState<Set<string>>(new Set());
  const [paidAmount, setPaidAmount] = useState<number>(0);

  const monthsList = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0,0,0,0);

  // Filter Logic
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesClass = filterClass ? student.classSession?.classLevelId === filterClass : true;
      const matchesTimeSlot = filterTimeSlot ? student.classSession?.timeSlotId === filterTimeSlot : true;
      
      // Determine if paid for the current month
      const lastPaid = student.lastFeePaidMonth ? new Date(student.lastFeePaidMonth) : null;
      const isPaid = lastPaid ? lastPaid >= currentMonthStart : false;
      
      const matchesStatus = statusFilter === 'ALL' ? true : (statusFilter === 'PAID' ? isPaid : !isPaid);

      return matchesSearch && matchesClass && matchesTimeSlot && matchesStatus;
    });
  }, [students, searchTerm, filterClass, filterTimeSlot, statusFilter]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const generateMonthRange = (student: Student) => {
    const range: MonthSelection[] = [];
    const today = new Date();
    const startYear = today.getFullYear();
    const startMonth = today.getMonth(); // 0-indexed

    // Calculate arrears: Start from the last paid month + 1
    // For demo, if lastFeePaidMonth is missing, assume they owe from start of year
    let anchorDate: Date;
    if (student.lastFeePaidMonth) {
      anchorDate = new Date(student.lastFeePaidMonth);
      anchorDate.setMonth(anchorDate.getMonth() + 1);
    } else {
      anchorDate = new Date(startYear, 0, 1); // Jan of current year
    }
    anchorDate.setDate(1);

    // Generate up to 12 months ahead from anchor or current month, whichever is later
    const limitDate = new Date(startYear, startMonth + 11, 1);
    
    let iter = new Date(anchorDate);
    while (iter <= limitDate) {
      const isArrear = iter < currentMonthStart;
      range.push({
        id: `${iter.getFullYear()}-${iter.getMonth()}`,
        label: `${monthsList[iter.getMonth()]} ${iter.getFullYear()}`,
        year: iter.getFullYear(),
        month: iter.getMonth(),
        amount: student.monthlyFees,
        isArrear
      });
      iter.setMonth(iter.getMonth() + 1);
    }

    return range;
  };

  const openPaymentModal = (student: Student) => {
    const available = generateMonthRange(student);
    setPaymentDetails({ student, availableMonths: available });
    
    // Auto-select arrears by default
    const initialSelected = new Set<string>();
    let initialTotal = 0;
    available.forEach(m => {
      if (m.isArrear) {
        initialSelected.add(m.id);
        initialTotal += m.amount;
      }
    });
    
    setSelectedMonthIds(initialSelected);
    setPaidAmount(initialTotal);
    setIsPaymentModalOpen(true);
  };

  const toggleMonth = (monthId: string) => {
    const newSelected = new Set(selectedMonthIds);
    if (newSelected.has(monthId)) {
      newSelected.delete(monthId);
    } else {
      newSelected.add(monthId);
    }
    setSelectedMonthIds(newSelected);
    
    // Recalculate total
    let total = 0;
    paymentDetails?.availableMonths.forEach(m => {
      if (newSelected.has(m.id)) total += m.amount;
    });
    setPaidAmount(total);
  };

  const handleConfirmPayment = () => {
    if (selectedMonthIds.size === 0) {
      alert("Please select at least one month to pay.");
      return;
    }

    // Find the latest month selected to update lastFeePaidMonth
    let latestDate = new Date(0);
    paymentDetails?.availableMonths.forEach(m => {
      if (selectedMonthIds.has(m.id)) {
        const d = new Date(m.year, m.month, 1);
        if (d > latestDate) latestDate = d;
      }
    });

    setStudents(prev => prev.map(s => {
      if (s.id === paymentDetails?.student.id) {
        return {
          ...s,
          lastFeePaidMonth: latestDate.toISOString()
        };
      }
      return s;
    }));

    alert(`Payment of $${paidAmount} recorded successfully for ${selectedMonthIds.size} months.`);
    setIsPaymentModalOpen(false);
    setPaymentDetails(null);
  };

  const handlePrintReceipt = (student: Student) => {
    setSelectedStudentForReceipt(student);
    setTimeout(() => {
        window.print();
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Fee Management</h2>
          <p className="text-sm text-gray-500">Track collections, arrears, and advance payments.</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          <TextField 
            label="Search" 
            placeholder="Name or Roll No..." 
            icon={Search}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="mb-0"
          />

          <div>
             <select 
               className="w-full h-12 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 text-gray-700 dark:text-gray-200"
               value={filterClass}
               onChange={(e) => { setFilterClass(e.target.value); setCurrentPage(1); }}
             >
               <option value="">All Classes</option>
               {classLevels.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
             </select>
             <label className="text-xs text-gray-500 relative -top-1">Filter by Class</label>
          </div>

          <div>
             <select 
               className="w-full h-12 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 text-gray-700 dark:text-gray-200"
               value={filterTimeSlot}
               onChange={(e) => { setFilterTimeSlot(e.target.value); setCurrentPage(1); }}
             >
               <option value="">All Time Slots</option>
               {timeSlots.map(ts => <option key={ts.id} value={ts.id}>{ts.label} ({ts.startTime} - {ts.endTime})</option>)}
             </select>
             <label className="text-xs text-gray-500 relative -top-1">Filter by Time Slot</label>
          </div>

          <div>
             <select 
               className="w-full h-12 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 text-gray-700 dark:text-gray-200"
               value={statusFilter}
               onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
             >
               <option value="ALL">All Status</option>
               <option value="PAID">Paid</option>
               <option value="UNPAID">Unpaid</option>
             </select>
             <label className="text-xs text-gray-500 relative -top-1">Filter by Status</label>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden no-print">
        <TableContainer className="border-none shadow-none">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Roll No</TableHeaderCell>
              <TableHeaderCell>Student Name</TableHeaderCell>
              <TableHeaderCell>Class Detail</TableHeaderCell>
              <TableHeaderCell>Contact</TableHeaderCell>
              <TableHeaderCell>Monthly Fee</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {paginatedStudents.map((student) => {
               const lastPaid = student.lastFeePaidMonth ? new Date(student.lastFeePaidMonth) : null;
               const isPaid = lastPaid ? lastPaid >= currentMonthStart : false;

               return (
                <TableRow key={student.id}>
                  <TableCell>{student.rollNumber}</TableCell>
                  <TableCell>
                     <div className="font-medium">{student.studentName}</div>
                     <div className="text-xs text-gray-500">{student.fatherName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{student.classSession?.classLevelName}</div>
                    <div className="text-xs text-gray-500">{student.classSession?.timeSlotLabel}</div>
                  </TableCell>
                  <TableCell>
                    <a href={`tel:${student.mobile}`} className="flex items-center text-xs text-gray-500 hover:text-primary-600">
                      <Phone size={12} className="mr-1" /> {student.mobile}
                    </a>
                  </TableCell>
                  <TableCell>${student.monthlyFees}</TableCell>
                  <TableCell>
                    {isPaid ? (
                      <Badge color="green"><span className="flex items-center gap-1"><CheckCircle size={12}/> Paid</span></Badge>
                    ) : (
                      <Badge color="red"><span className="flex items-center gap-1"><XCircle size={12}/> Unpaid</span></Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                       <Button variant="outlined" size="sm" onClick={() => handlePrintReceipt(student)}>
                          <Printer size={16} />
                       </Button>
                       <Button variant="contained" color={isPaid ? "primary" : "success"} size="sm" onClick={() => openPaymentModal(student)}>
                          {isPaid ? "Add Advance" : "Pay Now"}
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
               );
            })}
             {paginatedStudents.length === 0 && (
               <TableRow>
                 <TableCell colSpan={7} className="text-center py-12 text-gray-500">No students found.</TableCell>
               </TableRow>
             )}
          </tbody>
        </TableContainer>

        {/* Pagination Controls */}
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
           <div className="text-sm text-gray-700 dark:text-gray-400">
             Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> of <span className="font-medium">{filteredStudents.length}</span>
           </div>
           <div className="flex gap-2">
             <Button variant="outlined" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-2">
               <ChevronLeft size={16} />
             </Button>
             <Button variant="outlined" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-2">
               <ChevronRight size={16} />
             </Button>
           </div>
        </div>
      </Card>

      {/* Advanced Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Fee Payment & Advance"
        actions={
          <>
            <Button color="success" onClick={handleConfirmPayment}>
              Confirm Payment (${paidAmount})
            </Button>
            <Button variant="text" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
          </>
        }
      >
        {paymentDetails && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800 rounded-lg">
               <div>
                 <h3 className="font-bold text-lg text-primary-900 dark:text-primary-100">{paymentDetails.student.studentName}</h3>
                 <p className="text-xs text-primary-600">Roll: {paymentDetails.student.rollNumber} | Fee: ${paymentDetails.student.monthlyFees}/month</p>
               </div>
               <div className="text-right">
                  <Badge color="blue">{paymentDetails.student.classSession?.classLevelName}</Badge>
               </div>
            </div>

            <div>
               <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <CalendarIcon size={16} className="mr-2" /> Select Months to Pay (ماہانہ فیس منتخب کریں)
               </h4>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentDetails.availableMonths.map((m) => (
                    <label 
                      key={m.id}
                      className={`
                        flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${selectedMonthIds.has(m.id) 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                          : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'}
                      `}
                    >
                      <Checkbox 
                        checked={selectedMonthIds.has(m.id)} 
                        onChange={() => toggleMonth(m.id)}
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{m.label}</span>
                          {m.isArrear ? (
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight">Arrear (بقایا)</span>
                          ) : (
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-tight">Advance (ایڈوانس)</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">${m.amount}</p>
                      </div>
                    </label>
                  ))}
               </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
               <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Months Selected:</span>
                  <span className="font-bold">{selectedMonthIds.size}</span>
               </div>
               <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-800 dark:text-white">Total Amount:</span>
                  <span className="text-primary-600">${paidAmount}</span>
               </div>
            </div>

            <TextField 
              label="Optional Remarks" 
              placeholder="e.g. Paid via cash, partial waiver etc." 
            />
          </div>
        )}
      </Modal>

      {/* Printing Receipt View */}
      {selectedStudentForReceipt && (
        <div className="print-only fixed inset-0 bg-white p-12 z-[100] font-sans">
           <div className="border-4 border-double border-gray-800 p-10 max-w-3xl mx-auto relative">
              <div className="text-center border-b-2 border-gray-800 pb-6 mb-8">
                 <h1 className="text-4xl font-bold uppercase tracking-widest text-gray-900">Salah Institute</h1>
                 <p className="text-md text-gray-600 mt-2">Professional Madarsa Management System</p>
                 <div className="flex justify-center gap-6 mt-2 text-xs text-gray-500">
                    <span>Email: contact@salah.edu</span>
                    <span>•</span>
                    <span>Web: www.salahinstitute.com</span>
                 </div>
              </div>
              
              <div className="flex justify-between mb-8">
                 <div>
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Receipt Number</h2>
                    <p className="text-xl font-mono font-bold">#S-PAY-{Math.floor(Date.now() / 100000)}</p>
                 </div>
                 <div className="text-right">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Date of Issue</h2>
                    <p className="text-xl font-bold">{new Date().toLocaleDateString('en-GB')}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-10 mb-10 pb-8 border-b border-gray-200">
                 <div className="space-y-4">
                    <div>
                        <h2 className="text-xs font-bold text-gray-400 uppercase mb-1">Student Details</h2>
                        <p className="text-lg font-bold">{selectedStudentForReceipt.studentName}</p>
                        <p className="text-sm">Roll No: <span className="font-mono">{selectedStudentForReceipt.rollNumber}</span></p>
                    </div>
                    <div>
                        <h2 className="text-xs font-bold text-gray-400 uppercase mb-1">Class & Session</h2>
                        <p className="text-sm font-medium">{selectedStudentForReceipt.classSession?.classLevelName} - {selectedStudentForReceipt.classSession?.sectionName}</p>
                        <p className="text-xs text-gray-500">{selectedStudentForReceipt.classSession?.timeSlotLabel}</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div>
                        <h2 className="text-xs font-bold text-gray-400 uppercase mb-1">Parent Information</h2>
                        <p className="text-sm font-medium">{selectedStudentForReceipt.fatherName}</p>
                        <p className="text-sm">{selectedStudentForReceipt.mobile}</p>
                    </div>
                    <div className="bg-gray-50 p-3 border rounded">
                        <h2 className="text-xs font-bold text-gray-400 uppercase mb-1">Account Status</h2>
                        <p className="text-xs font-medium text-green-600">Up to date as of issuance.</p>
                    </div>
                 </div>
              </div>

              <table className="w-full mb-12">
                 <thead>
                    <tr className="border-b-2 border-gray-800 text-left">
                       <th className="py-4 font-bold text-sm">Description of Fees</th>
                       <th className="py-4 text-right font-bold text-sm">Amount</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    <tr>
                       <td className="py-4 text-sm">Current Month Tuition Fees</td>
                       <td className="text-right py-4 font-medium">${selectedStudentForReceipt.monthlyFees}</td>
                    </tr>
                    <tr className="bg-gray-50/50">
                       <td className="py-4 text-sm italic font-medium">Payment Method: Cash / Online</td>
                       <td className="text-right py-4">---</td>
                    </tr>
                 </tbody>
                 <tfoot>
                    <tr className="border-t-2 border-gray-800 bg-gray-100">
                       <td className="py-4 font-bold text-lg px-2">GRAND TOTAL</td>
                       <td className="text-right py-4 font-bold text-2xl text-primary-700 px-2">${selectedStudentForReceipt.monthlyFees}</td>
                    </tr>
                 </tfoot>
              </table>

              <div className="grid grid-cols-2 gap-20 mt-20">
                 <div className="text-center pt-4 border-t border-gray-400">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Office Signature</p>
                 </div>
                 <div className="text-center pt-4 border-t border-gray-400">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Parent/Guardian</p>
                 </div>
              </div>
              
              <div className="mt-16 text-center text-[10px] text-gray-400 border-t pt-4">
                 <p className="italic">This is a computer generated receipt and does not require a physical stamp unless specified. Knowledge is light.</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};