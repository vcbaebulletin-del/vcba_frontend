import React from 'react';
import { Input } from '../../ui';
import './FormField.css';

export interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  maxLength?: number;
  autoComplete?: string;
  'aria-describedby'?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  leftIcon,
  rightIcon,
  maxLength,
  autoComplete,
  'aria-describedby': ariaDescribedBy,
}) => {
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const helperTextId = `${fieldId}-helper`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(name, e.target.value);
  };

  return (
    <div className="form-field">
      <Input
        id={fieldId}
        name={name}
        label={label}
        type={type}
        value={value}
        onChange={handleChange}
        error={error}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        maxLength={maxLength}
        autoComplete={autoComplete}
        fullWidth
        aria-describedby={[
          error ? errorId : '',
          ariaDescribedBy || '',
          helperTextId,
        ].filter(Boolean).join(' ') || undefined}
        aria-invalid={!!error}
      />
    </div>
  );
};

export default FormField;
