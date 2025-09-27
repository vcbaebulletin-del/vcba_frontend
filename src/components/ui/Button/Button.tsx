import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClasses = `btn--${variant}`;
  const sizeClasses = `btn--${size}`;
  const fullWidthClasses = fullWidth ? 'btn--full-width' : '';
  const loadingClasses = isLoading ? 'btn--loading' : '';
  
  const combinedClasses = [
    baseClasses,
    variantClasses,
    sizeClasses,
    fullWidthClasses,
    loadingClasses,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={combinedClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="btn__spinner" aria-hidden="true">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              className="opacity-75"
            />
          </svg>
        </span>
      )}
      
      {!isLoading && leftIcon && (
        <span className="btn__icon btn__icon--left" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      
      <span className="btn__content">
        {children}
      </span>
      
      {!isLoading && rightIcon && (
        <span className="btn__icon btn__icon--right" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
};

export default Button;
