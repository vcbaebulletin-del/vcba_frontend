import React from 'react';
import FormField, { FormFieldProps } from '../FormField/FormField';
import './PasswordField.css';

interface PasswordFieldProps extends Omit<FormFieldProps, 'type' | 'rightIcon'> {
  showPassword: boolean;
  onToggleVisibility: () => void;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  showPassword,
  onToggleVisibility,
  ...props
}) => {
  const toggleButton = (
    <button
      type="button"
      onClick={onToggleVisibility}
      className="password-field__toggle"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      tabIndex={0}
    >
      {showPassword ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9.9 4.24A9.12 9.12 0 0 1 12 4C17 4 21.27 7.61 23 12A18.5 18.5 0 0 1 19.42 16.42"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="1"
            y1="1"
            x2="23"
            y2="23"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="12"
            r="3"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      )}
    </button>
  );

  const lockIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="11"
        width="18"
        height="11"
        rx="2"
        ry="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
      <path
        d="M7 11V7A5 5 0 0 1 17 7V11"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );

  return (
    <FormField
      {...props}
      type={showPassword ? 'text' : 'password'}
      leftIcon={lockIcon}
      rightIcon={toggleButton}
      autoComplete={props.name === 'password' ? 'new-password' : 'current-password'}
    />
  );
};

export default PasswordField;
