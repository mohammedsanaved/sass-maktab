import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Badge } from '../components/ui';
import { 
  ArrowLeft, 
  Edit, 
  Printer, 
  Phone, 
  User, 
  Home, 
  BookOpen, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  Briefcase, 
  CreditCard,
  FileText
} from 'lucide-react';
import { studentsData } from '../services/mockData';
import { StudyStatus, StudentType } from '../types';

export const StudentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Find student by ID or Roll Number
  const student = studentsData.find(s => s.id === id || s.rollNumber === id);

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <ShieldAlert size={64} className="text-red-500" />
        <h2 className="text-2xl font-bold">Student Not Found</h2>
        <p className="text-gray-500">The student you are looking for does not exist or has been removed.</p>
        <Button onClick={() => navigate('/students')}>Go Back to List</Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <Button variant="outlined" size="sm" onClick={() => navigate('/students')} className="p-2">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              Student Profile <span className="text-gray-400 font-normal">|</span> <span className="font-urdu text-lg">پروفائل</span>
            </h2>
            <p className="text-sm text-gray-500">Managing record for {student.studentName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outlined" onClick={handlePrint}>
            <Printer size={18} className="mr-2" /> Print Form
          </Button>
          <Button color="primary" onClick={() => navigate(`/students/${student.id}/edit`)}>
            <Edit size={18} className="mr-2" /> Edit Details
          </Button>
        </div>
      </div>

      {/* Profile Top Summary */}
      <Card className="border-t-4 border-primary-500">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-32 h-32 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center font-bold text-4xl shadow-inner">
            {student.studentName.charAt(0)}
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase font-semibold">Full Name / نام</p>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{student.studentName}</h1>
              <Badge color={student.type === StudentType.HAFIZ ? 'purple' : 'blue'}>{student.type}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase font-semibold">Roll Number / رول نمبر</p>
              <p className="text-xl font-bold text-primary-600">{student.rollNumber}</p>
              <p className="text-xs text-gray-500">GR No: {student.grNo || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase font-semibold">Study Status / تعلیمی حالت</p>
              <div className="pt-1">
                <Badge color={
                  student.studyStatus === StudyStatus.REGULAR ? 'green' : 
                  student.studyStatus === StudyStatus.IRREGULAR ? 'yellow' : 'blue'
                }>
                  {student.studyStatus}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase font-semibold">Current Class / درجہ</p>
              <p className="font-bold text-gray-700 dark:text-gray-200">{student.classSession?.classLevelName || 'N/A'}</p>
              <p className="text-xs text-gray-500">{student.classSession?.sectionName || 'N/A'}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Personal & Contact */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Details Section */}
          <Card>
            <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-600 mb-6 border-b pb-2">
              <User size={18} className="mr-2" /> Personal Information <span className="font-urdu ml-auto text-sm text-gray-500">ذاتی معلومات</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <InfoItem label="Date of Birth (تاریخ پیدائش)" value={student.dob || 'Not Provided'} icon={Calendar} />
              <InfoItem label="Gender (جنس)" value={student.gender === 'M' ? 'Male (مرد)' : 'Female (عورت)'} icon={User} />
              <InfoItem label="Age (عمر)" value={student.age ? `${student.age} Years` : 'Not Specified'} icon={Clock} />
              <InfoItem label="Admission Date (داخلہ تاریخ)" value={student.admissionDate || 'N/A'} icon={Calendar} />
              <div className="md:col-span-2">
                <InfoItem label="Residential Address (رہائشی پتہ)" value={student.address || 'Not Provided'} icon={Home} />
              </div>
            </div>
          </Card>

          {/* Family & Contact Details */}
          <Card>
            <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-600 mb-6 border-b pb-2">
              <Phone size={18} className="mr-2" /> Family & Contact <span className="font-urdu ml-auto text-sm text-gray-500">خاندانی تفصیلات</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <InfoItem label="Father's Name (والد کا نام)" value={student.fatherName} icon={User} />
              <InfoItem label="Parent's Profession (پیشہ)" value={student.parentProfession || 'N/A'} icon={Briefcase} />
              <InfoItem label="Primary Mobile (موبائل نمبر)" value={student.mobile} icon={Phone} link={`tel:${student.mobile}`} />
              <InfoItem label="Other Contact (دوسرا نمبر)" value={student.mobileOther || 'N/A'} icon={Phone} />
              
              <div className="md:col-span-2 mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Emergency Contact 1</p>
                   <p className="text-sm font-medium">{student.emergencyContact1 || 'None Set'}</p>
                </div>
                <div>
                   <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Emergency Contact 2</p>
                   <p className="text-sm font-medium">{student.emergencyContact2 || 'None Set'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Background Section */}
          <Card>
            <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-600 mb-6 border-b pb-2">
              <BookOpen size={18} className="mr-2" /> Academic Background <span className="font-urdu ml-auto text-sm text-gray-500">تعلیمی پس منظر</span>
            </h3>
            <div className="space-y-4">
               <InfoItem 
                label="Previous School & Standard (سابقہ اسکول اور جماعت)" 
                value={student.previousSchool || 'No previous school recorded.'} 
                icon={FileText} 
               />
               <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300 italic">
                    {student.remarks || "No specific remarks or quality assessment recorded for this student yet."}
                  </p>
               </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Academic Status & Finance */}
        <div className="space-y-8">
          {/* Office & Session Info */}
          <Card className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800">
            <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400 mb-6 border-b border-primary-200 dark:border-primary-800 pb-2">
              <ClipboardList size={18} className="mr-2" /> Session Details <span className="font-urdu ml-auto text-xs text-gray-500">دفتری معلومات</span>
            </h3>
            <div className="space-y-6">
               <div className="flex items-start gap-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <BookOpen size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Assigned Class</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100">{student.classSession?.classLevelName || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{student.classSession?.sectionName || 'N/A'}</p>
                  </div>
               </div>

               <div className="flex items-start gap-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <Clock size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Time Slot</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100">{student.classSession?.timeSlotLabel || 'N/A'}</p>
                  </div>
               </div>

               <div className="flex items-start gap-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <User size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Assigned Teacher</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100">{student.classSession?.teacherName || 'TBA'}</p>
                  </div>
               </div>
            </div>
          </Card>

          {/* Financial Summary */}
          <Card>
            <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-600 mb-6 border-b pb-2">
              <CreditCard size={18} className="mr-2" /> Fees & Finance <span className="font-urdu ml-auto text-xs text-gray-500">مالیاتی تفصیلات</span>
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500">Monthly Fees</span>
                <span className="font-bold text-lg text-primary-600">${student.monthlyFees}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500">Admission Fee</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">${student.admissionFee || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Current Status</span>
                <Badge color={student.lastFeePaidMonth ? 'green' : 'red'}>
                  {student.lastFeePaidMonth ? 'Paid for this month' : 'Unpaid / Defaulter'}
                </Badge>
              </div>
              
              <div className="mt-6">
                <Button fullWidth variant="outlined" color="primary" onClick={() => navigate('/payments')}>
                  View Payment History
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Internal components for clean layout
const ClipboardList = ({ size, className }: { size: number, className: string }) => <FileText size={size} className={className} />;

const InfoItem = ({ label, value, icon: Icon, link }: { label: string, value: string, icon: any, link?: string }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 text-gray-400">
      <Icon size={18} />
    </div>
    <div className="flex-1">
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{label}</p>
      {link ? (
        <a href={link} className="text-sm font-medium text-primary-600 hover:underline">{value}</a>
      ) : (
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</p>
      )}
    </div>
  </div>
);
