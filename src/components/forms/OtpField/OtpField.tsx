import React from 'react';
import FormField, { FormFieldProps } from '../FormField/FormField';
import './OtpField.css';

interface OtpFieldProps extends Omit<FormFieldProps, 'type' | 'leftIcon' | 'maxLength'> {
  // OTP specific props can be added here
}

const OtpField: React.FC<OtpFieldProps> = (props) => {
  const otpIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );

  return (
    <div className="otp-field">
      <FormField
        {...props}
        type="text"
        leftIcon={otpIcon}
        maxLength={6}
        autoComplete="one-time-code"
        placeholder="Enter 6-digit code"
      />
    </div>
  );
};

export default OtpField;
