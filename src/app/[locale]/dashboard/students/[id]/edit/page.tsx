'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Button, TextField, Select } from '@/components/ui';
import { ArrowLeft, Save, ClipboardList, Info, Phone, User, Home, ShieldAlert, Loader2 } from 'lucide-react';
import { Student, ClassLevel, TimeSlot, StudyStatus, StudentType } from '@/types';

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

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

        // Ensure we send classId and timeSlotId if they were changed
        // Or if we need to update session.
        // The API PUT /students/[id] handles { classId, timeSlotId } to update session.
        // The formData might have classSession object, but we need to send IDs if changed.
        // We stored IDs in formData in Select onChange below.

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
        <div className="flex gap-3">
          <Button variant="outlined" color="primary" onClick={() => router.back()}>Discard</Button>
          <Button color="success" onClick={handleSubmit} isLoading={submitting}>
            <Save size={18} className="mr-2" /> Save Changes
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Meta Information */}
        <Card variant="neubrutal" className="border-t-4 border-primary-500">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TextField 
                label="Form No." 
                value={formData.formNo || ''} 
                onChange={e => handleChange('formNo', e.target.value)} 
              />
              <TextField 
                label="Gr. No." 
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

        {/* Section 2: Personal */}
        <Card variant="neubrutal">
           <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-600 mb-6 border-b pb-2">
              <User size={18} className="mr-2" /> Personal Details
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <TextField 
                label="Full Name" 
                value={formData.studentName || ''} 
                onChange={e => handleChange('studentName', e.target.value)} 
                fullWidth 
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField 
                    label="DOB" 
                    type="date" 
                    value={dobInput} 
                    onChange={e => setDobInput(e.target.value)} 
                />
                <TextField 
                    label="Age" 
                    type="number"
                    value={formData.age || ''} 
                    onChange={e => handleChange('age', parseInt(e.target.value) || undefined)} 
                />
              </div>
              <div className="relative mb-4">
                 <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
                 <Select 
                    options={[
                        { value: 'M', label: 'Male' }, 
                        { value: 'F', label: 'Female' }
                    ]}
                    value={formData.gender}
                    onChange={e => handleChange('gender', e.target.value)}
                 />
              </div>
              <TextField 
                label="Address" 
                value={formData.residence || ''} 
                onChange={e => handleChange('residence', e.target.value)} 
                fullWidth 
                icon={Home}
              />
           </div>
        </Card>

        {/* Section 3: Contact */}
        <Card variant="neubrutal">
           <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-600 mb-6 border-b pb-2">
              <Info size={18} className="mr-2" /> Contact Info
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <TextField 
                label="Father's Name" 
                value={formData.fatherName || ''} 
                onChange={e => handleChange('fatherName', e.target.value)} 
              />
              <TextField 
                label="Mobile" 
                value={formData.mobile || ''} 
                onChange={e => handleChange('mobile', e.target.value)} 
                icon={Phone}
              />
              <TextField 
                label="Emergency Name" 
                value={formData.emergencyContactName || ''} 
                onChange={e => handleChange('emergencyContactName', e.target.value)} 
              />
               <TextField 
                label="Emergency Phone" 
                value={formData.emergencyContactPhone || ''} 
                onChange={e => handleChange('emergencyContactPhone', e.target.value)} 
              />
           </div>
        </Card>

        {/* Section 4: Office */}
        <Card variant="neubrutal">
           <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-600 mb-6 border-b pb-2">
              <ClipboardList size={18} className="mr-2" /> Office
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
                  <Select 
                    options={[{value: '', label: 'Select Class'}, ...classLevels.map(c => ({ value: c.id, label: c.name }))]}
                    value={
                         // If we changed it, it's in (formData as any).classId
                         // Else use loaded session
                         (formData as any).classId || formData.classSession?.classLevelId || ''
                    }
                    onChange={e => {
                        (formData as any).classId = e.target.value; // Store for PUT
                        setFormData({...formData});
                    }}
                  />
              </div>
              <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Time Slot</label>
                  <Select 
                     options={[{value: '', label: 'Select Time'}, ...timeSlots.map(t => ({ value: t.id, label: t.label }))]}
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
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <Select 
                     options={Object.values(StudyStatus).map(s => ({ value: s, label: s }))}
                     value={formData.studyStatus}
                     onChange={e => handleChange('studyStatus', e.target.value)}
                  />
              </div>
              <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                  <Select 
                     options={Object.values(StudentType).map(t => ({ value: t, label: t }))}
                     value={formData.type}
                     onChange={e => handleChange('type', e.target.value)}
                  />
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <TextField 
                label="Monthly Fees" 
                type="number"
                value={formData.monthlyFees || 0} 
                onChange={e => handleChange('monthlyFees', Number(e.target.value))} 
              />
              <TextField 
                label="Remark" 
                value={formData.remarks || ''} 
                onChange={e => handleChange('remarks', e.target.value)} 
              />
           </div>
        </Card>

        <div className="flex justify-end gap-4 pb-12">
            <Button variant="outlined" color="primary" onClick={() => router.back()}>Cancel</Button>
            <Button color="success" type="submit" isLoading={submitting}>
                <Save size={18} className="mr-2" /> Update Student
            </Button>
        </div>
      </form>
    </div>
  );
}
