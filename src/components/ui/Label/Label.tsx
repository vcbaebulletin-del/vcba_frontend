import React from 'react';
import './Label.css';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  variant?: 'default' | 'required' | 'optional';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Label: React.FC<LabelProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const labelClasses = [
    'label',
    `label--${variant}`,
    `label--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <label className={labelClasses} {...props}>
      {children}
      {variant === 'required' && <span className="label__required">*</span>}
    </label>
  );
};

export default Label;
