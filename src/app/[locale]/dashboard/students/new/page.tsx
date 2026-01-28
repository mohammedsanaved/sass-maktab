'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { FormikTextField, FormikSelect } from '@/components/FormikFields';
import { ArrowLeft, Save, ClipboardList, Info, Phone, User, Home } from 'lucide-react';
import { Student, ClassLevel, TimeSlot, AdmissionStatus, StudyStatus, StudentType, StudentStatus, HafizCategory, FullTimeSubCategory } from '@/types';

const validationSchema = Yup.object({
  studentName: Yup.string().required('Student name is required'),
  fatherName: Yup.string().required('Father name is required'),
  parentGuardianOccupation: Yup.string().required('Parent/Guardian profession is required'),
  mobile: Yup.string().required('Mobile number is required'),
  academicYear: Yup.string().required('Academic year is required'),
  gender: Yup.string().required('Gender is required'),
  dateOfBirth: Yup.date().required('Date of birth is required'),
  type: Yup.string().required('Student type is required'),
  admissionFee: Yup.number().min(0, 'Must be positive').required('Admission fee is required'),
  monthlyFees: Yup.number().min(0, 'Must be positive').required('Monthly fees is required'),
  hafizCategory: Yup.string().when('type', {
    is: (val: string) => val === StudentType.HAFIZ,
    then: (schema) => schema.required('Hafiz category is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  fullTimeSubCategory: Yup.string().when(['type', 'hafizCategory'], {
    is: (type: string, cat: string) => type === StudentType.HAFIZ && cat === HafizCategory.FULL_TIME,
    then: (schema) => schema.required('Full-time sub-category is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  classId: Yup.string().required('Class is required'),
  timeSlotId: Yup.string().required('Time slot is required'),
  remarks: Yup.string().required('Remarks are required'),
  admissionStatus: Yup.string().required('Admission status is required'),
  studyStatus: Yup.string().required('Study status is required'),
  status: Yup.string().required('Status is required'),
});

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Dropdown Data
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    // Fetch dropdowns
    const fetchSettings = async () => {
        const token = localStorage.getItem('accessToken');
        try {
            const [cRes, tRes] = await Promise.all([
                fetch('/api/settings/classes', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/settings/timeslots', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (cRes.ok) setClassLevels(await cRes.json());
            if (tRes.ok) setTimeSlots(await tRes.json());
        } catch(e) { console.error(e); }
    };
    fetchSettings();
  }, []);
  
  const formatTo12Hour = (timeStr: string): string => {
    if (!timeStr) return '--:--';
    if (timeStr.includes(' ')) return timeStr;
    const [hours, minutes] = timeStr.split(':');
    const h24 = parseInt(hours, 10);
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    return `${h12.toString().padStart(2, '0')}:${(minutes || '00').padStart(2, '0')} ${period}`;
  };

  const initialValues = {
    formNo: '',
    grNumber: '',
    academicYear: '2026-2027',
    studentName: '',
    fatherName: '',
    dateOfBirth: '',
    age: '',
    gender: 'M',
    residence: '',
    fullPermanentAddress: '',
    parentGuardianOccupation: '',
    mobile: '',
    previousSchool: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    classId: '',
    timeSlotId: '',
    type: StudentType.NAZERA,
    hafizCategory: '',
    fullTimeSubCategory: '',
    admissionFee: 0,
    monthlyFees: 0,
    remarks: '',
    admissionStatus: AdmissionStatus.IN_PROGRESS,
    studyStatus: StudyStatus.REGULAR,
    status: StudentStatus.NEW,
  };

  const handleSubmit = async (values: typeof initialValues) => {
    setLoading(true);

    try {
        const payload = {
            ...values,
            dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : undefined,
            age: values.age ? parseInt(values.age as string) : undefined,
        };

        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/students', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Student admitted successfully!");
            router.push('/dashboard/students');
        } else {
            const err = await response.json();
            alert(`Error: ${err.error || 'Failed to create student'}`);
            if (response.status === 409) {
                alert("Duplicate record found (Form No, GR No, etc).");
            }
        }

    } catch (error) {
        console.error(error);
        alert("An unexpected error occurred.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Button variant="outlined" size="sm" onClick={() => router.back()} className="p-2">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              New Admission <span className="text-foreground font-normal">|</span> <span className="font-urdu text-lg">داخلہ فارم</span>
            </h2>
            <p className="text-sm text-foreground">Fill in the student details based on the admission form.</p>
          </div>
        </div>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, errors }) => (
          <Form className="space-y-8">
            {/* Debug: Show validation errors if any */}
            {Object.keys(errors).length > 0 && (
              <Card className="bg-red-50 border-red-200 p-4 top-4 z-50 shadow-lg">
                <h4 className="text-red-800 font-bold mb-2">Please fix the following errors to complete admission:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  {Object.entries(errors).map(([key, value]) => (
                    <div key={key} className="text-red-700 text-sm flex items-start gap-2">
                       <span className="text-red-500 font-bold">•</span>
                       <span>{value as string}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {/* Section 1: Meta Information */}
            <Card variant="neubrutal" className="border-t-4 border-primary-500">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormikTextField 
                    name="formNo"
                    label="Form No. (فارم نمبر)" 
                    helperText="Auto-generated if empty"
                  />
                  <FormikTextField 
                    name="grNumber"
                    label="Gr. No. (جنرل رجسٹر نمبر)" 
                    helperText="Auto-generated if empty"
                  />
                  <FormikTextField 
                    name="academicYear"
                    label="Academic Year--- (تعلیمی سال)" 
                    placeholder="2024-2025"
                    required
                  />
               </div>
            </Card>

            {/* Section 2: Student Personal Info */}
            <Card variant="neubrutal">
               <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-primary-600 mb-6 border-b pb-2">
                  <User size={18} className="mr-2" /> Student's Personal Details <span className="font-urdu ml-auto text-sm text-gray-500">طالب علم کی تفصیلات</span>
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <FormikTextField 
                    name="studentName"
                    label="Student's Full Name (طالب علم کا مکمل نام)" 
                    fullWidth 
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormikTextField 
                        name="dateOfBirth"
                        label="DOB (تاریخ پیدائش)" 
                        type="date" 
                        required
                    />
                    <FormikTextField 
                        name="age"
                        label="Age (عمر)" 
                        type="number"
                    />
                  </div>
                  <FormikSelect 
                    name="gender"
                    label="Gender (جنس)"
                    options={[
                        { value: 'M', label: 'Male (مرد)' }, 
                        { value: 'F', label: 'Female (عورت)' }
                    ]}
                  />
               </div>
               <div className="mt-4">
                  <FormikTextField 
                    name="residence"
                    label="Full Residential Address (مکمل رہائشی پتہ)" 
                    fullWidth 
                    icon={Home}
                  />
                   <FormikTextField 
                    name="fullPermanentAddress"
                    label="Permanent Address (مستقل پتہ)" 
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
                  <FormikTextField 
                    name="fatherName"
                    label="Father's Name (والد کا نام)" 
                    required
                  />
                   <FormikTextField 
                    name="parentGuardianOccupation"
                    label="Parent/Guardian Profession (پیشہ)" 
                    required
                  />
                  <FormikTextField 
                    name="mobile"
                    label="Primary Mobile (موبائل نمبر)" 
                    icon={Phone}
                    required
                  />
                  <FormikTextField 
                    name="previousSchool"
                    label="Previous School (سابقہ اسکول)" 
                  />
               </div>

               <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 p-4 bg-primary-100/50 rounded-lg">
                  <div>
                      <h4 className="text-xs font-bold text-foreground uppercase mb-4">Emergency Contact 1</h4>
                      <FormikTextField 
                        name="emergencyContactName"
                        label="Name" 
                        fullWidth
                      />
                       <FormikTextField 
                        name="emergencyContactPhone"
                        label="Phone" 
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
                  <FormikSelect 
                    name="classId"
                    label="Assigned Class (درجہ)"
                    options={[{value: '', label: 'Select Class'}, ...classLevels.map(c => ({ value: c.id, label: c.name }))]}
                    required
                  />

                  <FormikSelect 
                     name="timeSlotId"
                     label="Time Slot (مناسب وقت)"
                     options={[{value: '', label: 'Select Time'}, ...timeSlots.map(t => ({ value: t.id, label: `${t.label} (${formatTo12Hour(t.startTime)})` }))]}
                    required
                  />

                  <FormikSelect 
                    name="type"
                    label="Student Type (قسم)"
                    options={Object.values(StudentType).map(t => ({ value: t, label: t }))}
                    required
                  />

                  {values.type === StudentType.HAFIZ && (
                    <>
                      <FormikSelect 
                        name="hafizCategory"
                        required
                        label="Hafiz Category (حفظ کی قسم)"
                        options={[{value: '', label: 'Select Category'}, ...Object.values(HafizCategory).map(c => ({ value: c, label: c.replace('_', ' ') }))]}
                      />
                      {values.hafizCategory === HafizCategory.FULL_TIME && (
                        <FormikSelect 
                          name="fullTimeSubCategory"
                          label="Full Time Sub Category (سب کیٹیگری)"
                          required
                          options={[{value: '', label: 'Select Sub Category'}, ...Object.values(FullTimeSubCategory).map(s => ({ value: s, label: s.replace('_', ' ') }))]}
                        />
                      )}
                    </>
                  )}

                  <FormikTextField 
                    name="monthlyFees"
                    label="Monthly Fees (ماہانہ فیس)" 
                    type="number" 
                    required
                  />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <FormikTextField 
                    name="admissionFee"
                    label="Admission Fee (ایڈمیشن فیس)" 
                    type="number" 
                    required
                  />
                  <FormikTextField 
                    name="remarks"
                    label="Remark (کیفیت)" 
                    required
                  />
               </div>
            </Card>

            {/* Form Actions Footer */}
            <div className="flex justify-end gap-4 pb-12">
                <Button variant="outlined" color="primary" size="lg" type="button" onClick={() => router.back()}>Discard</Button>
                <Button color="success" size="lg" type="submit" className="min-w-[200px]" isLoading={loading}>
                    <Save size={18} className="mr-2" /> Complete Admission
                </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
