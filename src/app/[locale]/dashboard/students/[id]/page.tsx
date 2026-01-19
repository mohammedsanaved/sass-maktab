'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Button, Badge } from '@/components/ui';
import { 
  ArrowLeft, Edit, Printer, Phone, User, Home, BookOpen, Clock, Calendar, ShieldAlert, Briefcase, CreditCard,
  ClipboardList
} from 'lucide-react';
import { Student } from '@/types';
import { Loader2 } from 'lucide-react';

export default function StudentProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStudent = async () => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/students/${id}`, {
           headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
          const data = await res.json();
          setStudent(data);
      } else {
          setStudent(null);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (id) fetchStudent();
  }, [id]);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary-500" size={40} /></div>;

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <ShieldAlert size={64} className="text-red-500" />
        <h2 className="text-2xl font-bold">Student Not Found</h2>
        <p className="text-gray-500">The student you are looking for does not exist or has been removed.</p>
        <Button onClick={() => router.push('/dashboard/students')}>Go Back to List</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <Button variant="outlined" size="sm" onClick={() => router.push('/dashboard/students')} className="p-2">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Student Profile <span className="font-normal">|</span> <span className="font-urdu text-lg">پروفائل</span>
            </h2>
            <p className="text-sm text-gray-500">Managing record for {student.studentName}</p>
          </div>
        </div>
        <div className="flex gap-2">
             {/* Print Button Removed */}
             <Button color="primary" className="hover:bg-primary-500 hover:text-white transition-colors duration-300 cursor-pointer" onClick={() => router.push(`/dashboard/students/${id}/edit`)}>
                <Edit size={18} className="mr-2" /> Edit Details
            </Button>
        </div>
      </div>

      {/* Profile Top Summary */}
      <Card className="border-t-4 border-primary-500">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-32 h-32 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center font-bold text-4xl shadow-inner">
            {student.studentName?.charAt(0)}
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase font-semibold">Full Name / نام</p>
              <h1 className="text-2xl font-bold text-foreground">{student.studentName}</h1>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase font-semibold">Roll Number / رول نمبر</p>
              <p className="text-xl font-bold text-foreground">{student.rollNumber || 'N/A'}</p> 
              <p className="text-xs text-gray-500">GR No: {student.grNumber || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase font-semibold">Study Status / تعلیمی حالت</p>
              <div className="pt-1">
                <Badge color={student.studyStatus === 'REGULAR' ? 'green' : 'yellow'}>
                    {student.studyStatus}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase font-semibold">Current Class / درجہ</p>
              <p className="font-bold text-foreground">{student.classSession?.classLevel?.name || 'N/A'}</p>
              <p className="text-xs text-gray-500">{student.classSession?.sectionName || ''}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Personal & Contact */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Details Section */}
          <Card >
            <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-600 mb-6 border-b pb-2">
              <User size={18} className="mr-2" /> Personal Information <span className="font-urdu ml-auto text-sm text-foreground">ذاتی معلومات</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <InfoItem label="Date of Birth" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'} icon={Calendar} />
                <InfoItem label="Gender" value={student.gender === 'M' ? 'Male' : 'Female'} icon={User} />
                <InfoItem label="Age" value={student.age ? `${student.age} Years` : 'Not Specified'} icon={Clock} />
                <InfoItem label="Joined At" value={new Date(student.joinedAt).toLocaleDateString()} icon={Calendar} />
                <div className="md:col-span-2">
                    <InfoItem label="Residential Address" value={student.residence || 'Not Provided'} icon={Home} />
                </div>
                <div className="md:col-span-2">
                    <InfoItem label="Permanent Address" value={student.fullPermanentAddress || 'Not Provided'} icon={Home} />
                </div>
            </div>
          </Card>

          {/* Family & Contact Details */}
          <Card >
            <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-600 mb-6 border-b pb-2">
              <Phone size={18} className="mr-2" /> Family & Contact <span className="font-urdu ml-auto text-sm text-gray-500">خاندانی تفصیلات</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <InfoItem label="Father's Name" value={student.fatherName} icon={User} />
                <InfoItem label="Guardian Profession" value={student.parentGuardianOccupation || 'N/A'} icon={Briefcase} />
                <InfoItem label="Primary Mobile" value={student.mobile} icon={Phone} link={`tel:${student.mobile}`} />
                <InfoItem label="Other Contact" value={student.mobileOther || 'N/A'} icon={Phone} />
                <div className="md:col-span-2 mt-4 p-4 bg-primary-100/50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                    <p className="text-[10px] uppercase font-bold text-foreground mb-2">Emergency Contact 1</p>
                    <p className="text-sm font-medium">{student.emergencyContactName || 'None'}</p>
                    <p className="text-xs text-gray-500">{student.emergencyContactPhone}</p>
                    </div>
                </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Academic Status & Finance */}
        <div className="space-y-8">
          {/* Office & Session Info */}
          <Card className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800">
            <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400 mb-6 border-b border-primary-200 dark:border-primary-800 pb-2">
              <ClipboardList size={18} className="mr-2" /> Session Details <span className="font-urdu ml-auto text-xs text-foreground">دفتری معلومات</span>
            </h3>
            <div className="space-y-6">
               <div className="flex items-start gap-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <BookOpen size={20} className="text-primary-600" />
                  </div>
                  <div className="w-full">
                    <p className="text-xs text-gray-500">Assigned Class</p>
                    <p className="font-bold text-foreground">{student.classSession?.classLevel?.name || 'N/A'}</p>
                  </div>
               </div>

               <div className="flex items-start gap-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <Clock size={20} className="text-orange-500" />
                  </div>
                  <div className="w-full">
                    <p className="text-xs text-gray-500">Time Slot</p>
                    <p className="font-bold text-foreground">{student.classSession?.timeSlot?.label || 'N/A'}</p>
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
                <span className="font-bold text-lg text-primary-600">₹{student.monthlyFees}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500">Admission Fee</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">₹{student.admissionFee || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500">Current Arrears</span>
                <span className={`font-bold ${student.arrears?.months ? 'text-red-500' : 'text-green-500'}`}>
                    {student.arrears?.months ? `${student.arrears.months} Months (₹${student.arrears.amount})` : 'Clear'}
                </span>
              </div>
              
              <div className="mt-6 flex flex-col gap-2">
                {student.arrears?.months ? (
                    <Button fullWidth color="primary" onClick={() => router.push('/dashboard/payments')}>
                        Pay Arrears Now
                    </Button>
                ) : null}
                <Button fullWidth className='cursor-pointer hover:bg-primary-500 hover:text-white transition-colors duration-300' variant="outlined" color="primary" onClick={() => router.push(`/dashboard/payments/${student.id}`)}>
                View Payment History
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const InfoItem = ({ label, value, icon: Icon, link }: { label: string, value: string, icon: any, link?: string }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 text-foreground">
      <Icon size={18} />
    </div>
    <div className="flex-1">
      <p className="text-[10px] text-foreground font-bold uppercase tracking-tight">{label}</p>
      {link ? (
        <a href={link} className="text-sm font-medium text-gray-500 hover:underline">{value}</a>
      ) : (
        <p className="text-sm font-medium text-gray-500">{value}</p>
      )}
    </div>
  </div>
);
