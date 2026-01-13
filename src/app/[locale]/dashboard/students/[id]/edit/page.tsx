'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Button, TextField, Select, Badge } from '@/components/ui';
import { ArrowLeft, Save, ClipboardList, Info, Phone, User, Home, ShieldAlert, Loader2 } from 'lucide-react';
import { Student, ClassLevel, TimeSlot, AdmissionStatus, StudyStatus, StudentType, StudentStatus, HafizCategory, FullTimeSubCategory } from '@/types';

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Dropdown Data
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [dobInput, setDobInput] = useState('');

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const [sRes, cRes, tRes] = await Promise.all([
            fetch(`/api/students/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/settings/classes', { headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/settings/timeslots', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (sRes.ok) {
            const student = await sRes.json();
            setFormData(student);
            if (student.dateOfBirth) {
                setDobInput(new Date(student.dateOfBirth).toISOString().split('T')[0]);
            }
        } else {
            setNotFound(true);
        }

        if (cRes.ok) setClassLevels(await cRes.json());
        if (tRes.ok) setTimeSlots(await tRes.json());
      } catch(e) { console.error(e); } 
      finally { setLoading(false); }
    };
    init();
  }, [id]);

  const handleChange = (field: keyof Student, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
        const payload = { ...formData };
        if (dobInput) payload.dateOfBirth = new Date(dobInput).toISOString();

        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/students/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Student updated successfully!");
            router.push(`/dashboard/students/${id}`);
        } else {
            alert("Failed to update student.");
        }
    } catch (e) {
        console.error(e);
        alert("Error updating student.");
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary-500" size={40} /></div>;

  if (notFound) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert size={64} className="text-red-500" />
          <h2 className="text-2xl font-bold">Student Not Found</h2>
          <Button onClick={() => router.push('/dashboard/students')}>Go Back</Button>
        </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Button variant="outlined" size="sm" onClick={() => router.back()} className="p-2">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              Edit Student <span className="text-gray-400 font-normal">|</span> <span className="font-urdu text-lg">ترمیم</span>
            </h2>
            <p className="text-sm text-gray-500">Updating record for {formData.studentName}</p>
          </div>
        </div>
        {/* Top Buttons Removed as per request */}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Meta Information */}
        <Card variant="neubrutal" className="border-t-4 border-primary-500">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TextField 
                label="Form No. (فارم نمبر)" 
                value={formData.formNo || ''} 
                onChange={e => handleChange('formNo', e.target.value)} 
              />
              <TextField 
                label="Gr. No. (جنرل رجسٹر نمبر)" 
                value={formData.grNumber || ''} 
                onChange={e => handleChange('grNumber', e.target.value)} 
              />
              <TextField 
                label="Roll Number" 
                value={formData.rollNumber || ''} 
                onChange={e => handleChange('rollNumber', e.target.value)} 
              />
           </div>
        </Card>

        {/* Section 2: Student Personal Info */}
        <Card variant="neubrutal">
           <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-600 mb-6 border-b pb-2">
              <User size={18} className="mr-2" /> Student's Personal Details <span className="font-urdu ml-auto text-sm text-gray-500">طالب علم کی تفصیلات</span>
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <TextField 
                label="Student's Full Name (طالب علم کا مکمل نام)" 
                value={formData.studentName || ''} 
                onChange={e => handleChange('studentName', e.target.value)} 
                fullWidth 
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField 
                    label="DOB (تاریخ پیدائش)" 
                    type="date" 
                    value={dobInput} 
                    onChange={e => setDobInput(e.target.value)} 
                    required
                />
                <TextField 
                    label="Age (عمر)" 
                    value={formData.age || ''} 
                    onChange={e => handleChange('age', parseInt(e.target.value) || undefined)}
                    type="number"
                />
              </div>
              <div className="relative mb-4">
                 <label className="block text-xs font-medium text-gray-500 mb-1">Gender (جنس)</label>
                 <Select 
                    options={[
                        { value: 'M', label: 'Male (مرد)' }, 
                        { value: 'F', label: 'Female (عورت)' }
                    ]}
                    value={formData.gender}
                    onChange={e => handleChange('gender', e.target.value)}
                 />
              </div>
           </div>
           <div className="mt-4">
              <TextField 
                label="Full Residential Address (مکمل رہائشی پتہ)" 
                value={formData.residence || ''} 
                onChange={e => handleChange('residence', e.target.value)} 
                fullWidth 
                icon={Home}
              />
               <TextField 
                label="Permanent Address (مستقل پتہ)" 
                value={formData.fullPermanentAddress || ''} 
                onChange={e => handleChange('fullPermanentAddress', e.target.value)} 
                fullWidth 
              />
           </div>
        </Card>

        {/* Section 3: Background & Contact */}
        <Card variant="neubrutal">
           <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-600 mb-6 border-b pb-2">
              <Info size={18} className="mr-2" /> Academic & Family Background <span className="font-urdu ml-auto text-sm text-gray-500">پس منظر اور خاندان</span>
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <TextField 
                label="Father's Name (والد کا نام)" 
                value={formData.fatherName || ''} 
                onChange={e => handleChange('fatherName', e.target.value)} 
                required
              />
               <TextField 
                label="Parent/Guardian Profession (پیشہ)" 
                value={formData.parentGuardianOccupation || ''} 
                onChange={e => handleChange('parentGuardianOccupation', e.target.value)} 
              />
              <TextField 
                label="Primary Mobile (موبائل نمبر)" 
                value={formData.mobile || ''} 
                onChange={e => handleChange('mobile', e.target.value)} 
                icon={Phone}
                required
              />
              <TextField 
                label="Previous School (سابقہ اسکول)" 
                value={formData.previousSchool || ''} 
                onChange={e => handleChange('previousSchool', e.target.value)} 
              />
           </div>

           <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Emergency Contact 1</h4>
                  <TextField 
                    label="Name" 
                    value={formData.emergencyContactName || ''} 
                    onChange={e => handleChange('emergencyContactName', e.target.value)} 
                    fullWidth
                  />
                   <TextField 
                    label="Phone" 
                    value={formData.emergencyContactPhone || ''} 
                    onChange={e => handleChange('emergencyContactPhone', e.target.value)} 
                    fullWidth
                  />
              </div>
           </div>
        </Card>

        {/* Section 4: Office Use */}
        <Card variant="neubrutal" className="bg-primary-50/50 dark:bg-primary-900/5 border border-primary-100 dark:border-primary-900/30">
           <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400 mb-6 border-b border-primary-200 dark:border-primary-800 pb-2">
              <ClipboardList size={18} className="mr-2" /> Office Use Only <span className="font-urdu ml-auto text-sm text-gray-500">صرف دفتری استعمال کے لئے</span>
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Assigned Class (درجہ)</label>
                  <Select 
                    options={[{value: '', label: 'Select Class'}, ...classLevels.map(c => ({ value: c.id, label: c.name }))]}
                    value={
                         // If we changed it, it's in (formData as any).classId
                         // Else use loaded session
                         (formData as any).classId || formData.classSession?.classLevelId || ''
                    }
                    onChange={e => {
                        // We are using formData loose keys for payload
                        (formData as any).classId = e.target.value;
                        setFormData({...formData});
                    }}
                  />
              </div>

              <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Time Slot (مناسب وقت)</label>
                  <Select 
                     options={[{value: '', label: 'Select Time'}, ...timeSlots.map(t => ({ value: t.id, label: `${t.label} (${t.startTime})` }))]}
                     value={
                         (formData as any).timeSlotId || formData.classSession?.timeSlotId || ''
                     }
                     onChange={e => {
                        (formData as any).timeSlotId = e.target.value;
                        setFormData({...formData});
                     }}
                  />
              </div>

              <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Student Type (قسم)</label>
                  <Select 
                    options={Object.values(StudentType).map(t => ({ value: t, label: t }))}
                    value={formData.type}
                    onChange={e => handleChange('type', e.target.value)}
                  />
              </div>

              {formData.type === StudentType.HAFIZ && (
                <>
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Hafiz Category (حفظ کی قسم)</label>
                      <Select 
                        options={[{value: '', label: 'Select Category'}, ...Object.values(HafizCategory).map(c => ({ value: c, label: c.replace('_', ' ') }))]}
                        value={formData.hafizCategory}
                        onChange={e => handleChange('hafizCategory', e.target.value)}
                      />
                  </div>
                  {formData.hafizCategory === HafizCategory.FULL_TIME && (
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Full Time Sub Category (سب کیٹیگری)</label>
                        <Select 
                          options={[{value: '', label: 'Select Sub Category'}, ...Object.values(FullTimeSubCategory).map(s => ({ value: s, label: s.replace('_', ' ') }))]}
                          value={formData.fullTimeSubCategory}
                          onChange={e => handleChange('fullTimeSubCategory', e.target.value)}
                        />
                    </div>
                  )}
                </>
              )}

              <TextField 
                label="Monthly Fees (ماہانہ فیس)" 
                type="number" 
                value={formData.monthlyFees || 0} 
                onChange={e => handleChange('monthlyFees', Number(e.target.value))} 
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <TextField 
                label="Admission Fee (ایڈمیشن فیس)" 
                type="number" 
                value={formData.admissionFee || 0} 
                onChange={e => handleChange('admissionFee', Number(e.target.value))} 
              />
              <TextField 
                label="Remark (کیفیت)" 
                value={formData.remarks || ''} 
                onChange={e => handleChange('remarks', e.target.value)} 
              />
              <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Admission Status</label>
                  <Select 
                     options={Object.values(AdmissionStatus).map(s => ({ value: s, label: s }))}
                     value={formData.admissionStatus}
                     onChange={e => handleChange('admissionStatus', e.target.value)}
                  />
              </div>
           </div>
        </Card>

        {/* Form Actions Footer */}
        <div className="flex justify-end gap-4 pb-12">
            <Button variant="outlined" color="primary" size="lg" onClick={() => router.back()}>Discard</Button>
            <Button color="success" size="lg" type="submit" className="min-w-[200px]" isLoading={submitting}>
                <Save size={18} className="mr-2" /> Save Changes
            </Button>
        </div>
      </form>
    </div>
  );
}
