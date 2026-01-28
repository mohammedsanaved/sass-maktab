'use client';
import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button, TextField, Modal, TimeInput } from '@/components/ui';

interface TimeSlotFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: any) => Promise<void>;
  initialData: {
    id?: string;
    label: string;
    startTime: string; // Expected format "HH:mm AM/PM"
    endTime: string;   // Expected format "HH:mm AM/PM"
  } | null;
}

// FIX: Helper to convert "HH:mm AM/PM" string into raw minutes for numeric comparison
const timeStringToMinutes = (timeStr: string): number => {
  if (!timeStr || !timeStr.includes(':')) return 0;
  
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (modifier?.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

const validationSchema = Yup.object({
  label: Yup.string().required('Label is required'),
  startTime: Yup.string().required('Start time is required'),
  endTime: Yup.string()
    .required('End time is required')
    .test(
      'is-after-start-time',
      'End time must be after start time',
      function (value) {
        const { startTime } = this.parent;
        if (!value || !startTime) return true; 

        // FIX: Compare numeric minutes, not formatted strings
        const startMins = timeStringToMinutes(startTime);
        const endMins = timeStringToMinutes(value);
        
        return endMins > startMins;
      }
    ),
});

export const TimeSlotForm: React.FC<TimeSlotFormProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const initialValues = {
    label: initialData?.label || '',
    startTime: initialData?.startTime || '',
    endTime: initialData?.endTime || '',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Time Slot' : 'Add New Time Slot'}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          await onSave({ ...initialData, ...values });
        }}
        enableReinitialize
      >
        {({ isSubmitting, dirty, isValid, values, setFieldValue }) => (
          <Form>
            <div className="space-y-4">
              <div>
                <Field
                  name="label"
                  as={TextField}
                  label="Label (e.g., Morning, Evening)"
                />
                <ErrorMessage name="label" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div>
                <TimeInput 
                  label='Start Time'
                  value={values.startTime}
                  // FIX: Pass 'true' to shouldValidate to trigger the 'endTime' check immediately
                  onChange={(value) => setFieldValue('startTime', value, true)}
                />
                <ErrorMessage name="startTime" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div>
                <TimeInput 
                  label='End Time'
                  value={values.endTime}
                  onChange={(value) => setFieldValue('endTime', value, true)}
                />
                <ErrorMessage name="endTime" component="div" className="text-red-500 text-sm mt-1" />
              </div>
            </div>

            <div className="mt-8 pt-4 border-t flex justify-end gap-2">
              <Button type="button" variant="outlined" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={!dirty || !isValid || isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};