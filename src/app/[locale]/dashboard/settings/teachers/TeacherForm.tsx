'use client';
import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button, TextField, Modal } from '@/components/ui';

interface TeacherFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: any) => void;
  initialData: any | null; // Use a proper type for the teacher
}

// More specific validation
const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  phone: Yup.string()
    .required('Phone number is required')
    .matches(/^[0-9]+$/, "Must be only digits")
    .min(10, 'Must be at least 10 digits'),
  email: Yup.string()
    .required('Email is required')
    .email('Invalid email address'),
//   cnic: Yup.string()
//     .required('CNIC is required')
//     .matches(/^[0-9]+$/, "Must be only digits")
//     .length(13, 'CNIC must be exactly 13 digits'),
  address: Yup.string(),
  // Password is only required when creating a new teacher
  password: Yup.string().when('id', {
    is: (id: any) => !id,
    then: (schema) => schema.required('Password is required for new teachers').min(6, 'Password must be at least 6 characters'),
    otherwise: (schema) => schema.min(6, 'Password must be at least 6 characters'),
  }),
});

export const TeacherForm: React.FC<TeacherFormProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const initialValues = {
    id: initialData?.id || undefined,
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    password: '', // Always start with an empty password field for security
  };

  const handleSubmit = (values: any) => {
    // Don't submit the password if it's empty (when editing)
    const dataToSave = { ...values };
    if (initialData?.id && !dataToSave.password) {
      delete dataToSave.password;
    }
    onSave(dataToSave);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Teacher' : 'Add New Teacher'}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, dirty, isValid }) => (
          <Form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field name="name" as={TextField} label="Teacher Name" />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <Field name="phone" as={TextField} label="Phone" />
                <ErrorMessage name="phone" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <Field name="email" as={TextField} label="Email" />
                <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              {/* <div>
                <Field name="cnic" as={TextField} label="CNIC (without dashes)" />
                <ErrorMessage name="cnic" component="div" className="text-red-500 text-sm mt-1" />
              </div> */}
              <div className="md:col-span-2">
                <Field name="address" as={TextField} label="Address" />
                <ErrorMessage name="address" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div className="md:col-span-2">
                <Field
                  name="password"
                  type="password"
                  as={TextField}
                  label={initialData ? 'New Password (leave blank to keep current)' : 'Password'}
                />
                <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
              </div>
            </div>
            <div className="mt-8 pt-4 border-t flex justify-end gap-2">
              <Button type="button" variant="text" onClick={onClose}>
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
