'use client';
import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button, TextField, Modal } from '@/components/ui';

interface ClassSessionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: any) => void;
  initialData: {
    id?: string;
    name: string;
    description: string;
  } | null;
}

const validationSchema = Yup.object({
  name: Yup.string().required('Class name is required'),
  description: Yup.string(),
});

export const ClassSessionForm: React.FC<ClassSessionFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const initialValues = {
    name: initialData?.name || '',
    description: initialData?.description || '',
  };

  const handleSubmit = (values: { name: string; description: string }) => {
    onSave({ ...initialData, ...values });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? 'Edit Class' : 'Add New Class'}
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, dirty, isValid }) => (
          <Form>
            <div className="space-y-4">
              <div>
                <Field
                  name="name"
                  as={TextField}
                  label="Class Name"
                />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div>
                <Field
                  name="description"
                  as={TextField}
                  label="Description"
                />
                <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
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
