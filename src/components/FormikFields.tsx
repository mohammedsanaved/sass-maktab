import React from 'react';
import { useField } from 'formik';
import { TextField, Select } from './ui';
import { LucideIcon } from 'lucide-react';

interface FormikTextFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  icon?: LucideIcon;
  fullWidth?: boolean;
  helperText?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FormikTextField: React.FC<FormikTextFieldProps> = ({ name, ...props }) => {
  const [field, meta] = useField(name);
  const error = !!meta.touched && !!meta.error;
  
  return (
    <TextField
      {...field}
      {...props}
      error={error}
      helperText={error ? meta.error : props.helperText}
      value={field.value ?? ''}
      onChange={e => {
        field.onChange(e);
        if (props.onChange) props.onChange(e);
      }}
    />
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string | number; label: string }[];
  label?: string;
  error?: boolean;
  helperText?: string;
}

interface FormikSelectProps {
  name: string;
  label: string;
  options: { value: string | number; label: string }[];
  required?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const FormikSelect: React.FC<FormikSelectProps> = ({ name, label, helperText, ...props }) => {
  const [field, meta] = useField(name);
  const error = !!meta.touched && !!meta.error;

  return (
    <Select
      {...field}
      {...props}
      label={label}
      error={error}
      helperText={error ? meta.error : helperText}
      value={field.value ?? ''}
      onChange={e => {
        field.onChange(e);
        if (props.onChange) props.onChange(e);
      }}
    />
  );
};
