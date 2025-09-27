import React, { forwardRef } from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  fullWidth = false,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const containerClasses = [
    'input-container',
    fullWidth ? 'input-container--full-width' : '',
    error ? 'input-container--error' : '',
    className,
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'input',
    `input--${variant}`,
    leftIcon ? 'input--with-left-icon' : '',
    rightIcon ? 'input--with-right-icon' : '',
    error ? 'input--error' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {props.required && <span className="input-label__required">*</span>}
        </label>
      )}
      
      <div className="input-wrapper">
        {leftIcon && (
          <div className="input-icon input-icon--left" aria-hidden="true">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          {...props}
        />
        
        {rightIcon && (
          <div className="input-icon input-icon--right" aria-hidden="true">
            {rightIcon}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className="input-message">
          {error ? (
            <span className="input-error" role="alert">
              {error}
            </span>
          ) : (
            <span className="input-helper">
              {helperText}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
