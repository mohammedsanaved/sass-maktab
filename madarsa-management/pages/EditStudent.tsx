
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, TextField } from '../components/ui';
import { ArrowLeft, Save, ClipboardList, Info, Phone, User, Home, ShieldAlert, BookOpen, Clock } from 'lucide-react';
import { classSessions, timeSlots, studentsData } from '../services/mockData';
import { Student, StudentType, AdmissionStatus, StudyStatus, StudentStatus } from '../types';

export const EditStudent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<Partial<Student> | null>(null);

  useEffect(() => {
    // Find student by ID or Roll Number to populate form
    const student = studentsData.find(s => s.id === id || s.rollNumber === id);
    if (student) {
      setFormData({ ...student });
    }
  }, [id]);

  if (!formData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <ShieldAlert size={64} className="text-red-500" />
        <h2 className="text-2xl font-bold">Student Not Found</h2>
        <p className="text-gray-500">The record you are trying to edit does not exist.</p>
        <Button onClick={() => navigate('/students')}>Go Back</Button>
      </div>
    );
  }

  const handleChange = (field: keyof Student, value: any) => {
    setFormData(prev => ({ ...prev!, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.mobile) {
      alert("Please fill in basic details (Name and Mobile)");
      return;
    }
    // Simulation of update
    console.log("Updating Student Record:", formData);
    alert("Student record updated successfully!");
    navigate(`/students/${formData.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Button variant="outlined" size="sm" onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              Edit Student <span className="text-gray-400 font-normal">|</span> <span className="font-urdu text-lg">طالب علم کی ترمیم</span>
            </h2>
            <p className="text-sm text-gray-500">Updating record for {formData.studentName}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outlined" color="primary" onClick={() => navigate(-1)}>Discard</Button>
          <Button color="success" onClick={handleSubmit}>
            <Save size={18} className="mr-2" /> Save Changes
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Meta Information */}
        <Card className="border-t-4 border-primary-500">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TextField 
                label="Form No. (فارم نمبر)" 
                value={formData.formNo || ''} 
                onChange={e => handleChange('formNo', e.target.value)} 
              />
              <TextField 
                label="Gr. No. (جنرل رجسٹر نمبر)" 
                value={formData.grNo || ''} 
                onChange={e => handleChange('grNo', e.target.value)} 
              />
              <TextField 
                label="Admission Date (تاریخ داخلہ)" 
                type="date" 
                value={formData.admissionDate || ''} 
                onChange={e => handleChange('admissionDate', e.target.value)} 
              />
           </div>
        </Card>

        {/* Section 2: Student Personal Info */}
        <Card>
           <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-600 mb-6 border-b pb-2">
              <User size={18} className="mr-2" /> Student's Personal Details <span className="font-urdu ml-auto text-sm text-gray-500">طالب علم کی تفصیلات</span>
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <TextField 
                label="Student's Full Name (طالب علم کا مکمل نام)" 
                value={formData.studentName || ''} 
                onChange={e => handleChange('studentName', e.target.value)} 
                fullWidth 
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField 
                    label="DOB (تاریخ پیدائش)" 
                    type="date" 
                    value={formData.dob || ''} 
                    onChange={e => handleChange('dob', e.target.value)} 
                />
                <TextField 
                    label="Age (عمر)" 
                    value={formData.age || ''} 
                    onChange={e => handleChange('age', e.target.value)} 
                />
              </div>
              <div className="relative mb-4">
                 <select 
                    className="peer w-full h-12 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 appearance-none text-gray-900 dark:text-gray-100"
                    value={formData.gender}
                    onChange={e => handleChange('gender', e.target.value as any)}
                 >
                    <option value="M">Male (مرد)</option>
                    <option value="F">Female (عورت)</option>
                 </select>
                 <label className="absolute left-0 -top-3.5 text-gray-500 text-xs transition-all">Sex (جنس)</label>
              </div>
              <TextField 
                label="Roll Number (رول نمبر)" 
                value={formData.rollNumber || ''} 
                onChange={e => handleChange('rollNumber', e.target.value)} 
              />
           </div>
           <div className="mt-4">
              <TextField 
                label="Full Residential Address (مکمل رہائشی پتہ)" 
                value={formData.address || ''} 
                onChange={e => handleChange('address', e.target.value)} 
                fullWidth 
                icon={Home}
              />
           </div>
        </Card>

        {/* Section 3: Background & Contact */}
        <Card>
           <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-600 mb-6 border-b pb-2">
              <Info size={18} className="mr-2" /> Academic & Family Background <span className="font-urdu ml-auto text-sm text-gray-500">پس منظر اور خاندان</span>
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <TextField 
                label="Previous School Name & Class (پچھلا اسکول اور جماعت)" 
                value={formData.previousSchool || ''} 
                onChange={e => handleChange('previousSchool', e.target.value)} 
                placeholder="Name of the School & Standard"
              />
              <TextField 
                label="Parent/Guardian Profession (والدین / سرپرست کا پیشہ)" 
                value={formData.parentProfession || ''} 
                onChange={e => handleChange('parentProfession', e.target.value)} 
                placeholder="Service / Business / Other"
              />
              <TextField 
                label="Father/Guardian Full Name (والد کا نام)" 
                value={formData.fatherName || ''} 
                onChange={e => handleChange('fatherName', e.target.value)} 
              />
              <TextField 
                label="Primary Contact No. (موبائل نمبر)" 
                value={formData.mobile || ''} 
                onChange={e => handleChange('mobile', e.target.value)} 
                icon={Phone}
              />
              <TextField 
                label="Other Contact / Residence (دیگر رابطہ نمبر)" 
                value={formData.mobileOther || ''} 
                onChange={e => handleChange('mobileOther', e.target.value)} 
              />
           </div>

           <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Emergency Contact 1</h4>
                  <TextField 
                    label="Name & Contact (نام اور رابطہ نمبر)" 
                    value={formData.emergencyContact1 || ''} 
                    onChange={e => handleChange('emergencyContact1', e.target.value)} 
                    fullWidth
                  />
              </div>
              <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Emergency Contact 2</h4>
                  <TextField 
                    label="Name & Contact (نام اور رابطہ نمبر)" 
                    value={formData.emergencyContact2 || ''} 
                    onChange={e => handleChange('emergencyContact2', e.target.value)} 
                    fullWidth
                  />
              </div>
           </div>
        </Card>

        {/* Section 4: Office Use - Mirrored from NewStudent */}
        <Card className="bg-primary-50/50 dark:bg-primary-900/5 border border-primary-100 dark:border-primary-900/30">
           <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400 mb-6 border-b border-primary-200 dark:border-primary-800 pb-2">
              <ClipboardList size={18} className="mr-2" /> Office Use Only <span className="font-urdu ml-auto text-sm text-gray-500">صرف دفتری استعمال کے لئے</span>
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Assigned Class (درجہ)</label>
                  <select 
                    className="w-full h-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.classSessionId}
                    onChange={e => handleChange('classSessionId', e.target.value)}
                  >
                    <option value="">Select Class</option>
                    {classSessions.map(cs => (
                        <option key={cs.id} value={cs.id}>{cs.classLevelName} - {cs.sectionName}</option>
                    ))}
                  </select>
              </div>

              <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Time Slot (مناسب وقت)</label>
                  <select 
                    className="w-full h-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.classSession?.timeSlotId || ''}
                    onChange={e => {
                        // Logic to handle time slot change
                        console.log("Slot ID:", e.target.value);
                    }}
                  >
                    <option value="">Select Timing</option>
                    {timeSlots.map(ts => (
                        <option key={ts.id} value={ts.id}>{ts.label} ({ts.startTime} - {ts.endTime})</option>
                    ))}
                  </select>
              </div>

              <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Student Type (قسم)</label>
                  <select 
                    className="w-full h-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.type}
                    onChange={e => handleChange('type', e.target.value as any)}
                  >
                    <option value={StudentType.NAZERA}>Nazera (ناظرہ)</option>
                    <option value={StudentType.HAFIZ}>Hafiz (حفظ)</option>
                  </select>
              </div>

              <TextField 
                label="Monthly Fees (ماہانہ فیس)" 
                type="number" 
                value={formData.monthlyFees || 0} 
                onChange={e => handleChange('monthlyFees', Number(e.target.value))} 
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status (تعلیمی حالت)</label>
                  <select 
                    className="w-full h-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.studyStatus}
                    onChange={e => handleChange('studyStatus', e.target.value as any)}
                  >
                    {Object.values(StudyStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
              </div>

              <TextField 
                label="Admission Fee (ایڈمیشن فیس)" 
                type="number" 
                value={formData.admissionFee || 0} 
                onChange={e => handleChange('admissionFee', Number(e.target.value))} 
              />
              
              <TextField 
                label="Receipt No. (رسید نمبر)" 
                value={formData.receiptNo || ''} 
                onChange={e => handleChange('receiptNo', e.target.value)} 
              />
              
              <TextField 
                label="Remark (کیفیت)" 
                value={formData.remarks || ''} 
                onChange={e => handleChange('remarks', e.target.value)} 
              />
           </div>
        </Card>

        {/* Form Actions Footer */}
        <div className="flex justify-end gap-4 pb-12">
            <Button variant="outlined" color="primary" size="lg" onClick={() => navigate(-1)}>Discard Changes</Button>
            <Button color="success" size="lg" type="submit" className="min-w-[200px]">
                <Save size={18} className="mr-2" /> Save Changes
            </Button>
        </div>
      </form>
    </div>
  );
};
