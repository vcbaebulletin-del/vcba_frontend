import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import './Select.css';

// Context for Select state management
interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  placeholder?: string;
}

const SelectContext = createContext<SelectContextType | null>(null);

const useSelectContext = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select component');
  }
  return context;
};

// Main Select component
export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  value: controlledValue,
  onValueChange,
  defaultValue = '',
  placeholder = 'Select an option...',
  disabled = false,
  children,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const contextValue: SelectContextType = {
    value,
    onValueChange: handleValueChange,
    isOpen,
    setIsOpen,
    placeholder,
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <div 
        ref={selectRef} 
        className={`select ${disabled ? 'select--disabled' : ''}`}
        data-disabled={disabled}
      >
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// SelectTrigger component
export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  children,
  className = '',
  ...props
}) => {
  const { isOpen, setIsOpen } = useSelectContext();

  const handleClick = () => {
    if (!props.disabled) {
      setIsOpen(!isOpen);
    }
  };

  const triggerClasses = [
    'select__trigger',
    isOpen ? 'select__trigger--open' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={triggerClasses}
      onClick={handleClick}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      {...props}
    >
      {children}
      <svg
        className="select__trigger-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6,9 12,15 18,9" />
      </svg>
    </button>
  );
};

// SelectValue component
export interface SelectValueProps {
  placeholder?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder: propPlaceholder }) => {
  const { value, placeholder: contextPlaceholder } = useSelectContext();
  
  const displayPlaceholder = propPlaceholder || contextPlaceholder;
  
  return (
    <span className={`select__value ${!value ? 'select__value--placeholder' : ''}`}>
      {value || displayPlaceholder}
    </span>
  );
};

// SelectContent component
export interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectContent: React.FC<SelectContentProps> = ({
  children,
  className = '',
}) => {
  const { isOpen } = useSelectContext();

  if (!isOpen) return null;

  const contentClasses = [
    'select__content',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={contentClasses} role="listbox">
      {children}
    </div>
  );
};

// SelectItem component
export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const SelectItem: React.FC<SelectItemProps> = ({
  value: itemValue,
  children,
  disabled = false,
  className = '',
}) => {
  const { value: selectedValue, onValueChange } = useSelectContext();

  const handleClick = () => {
    if (!disabled) {
      onValueChange(itemValue);
    }
  };

  const isSelected = selectedValue === itemValue;

  const itemClasses = [
    'select__item',
    isSelected ? 'select__item--selected' : '',
    disabled ? 'select__item--disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={itemClasses}
      onClick={handleClick}
      role="option"
      aria-selected={isSelected}
      data-disabled={disabled}
    >
      {children}
      {isSelected && (
        <svg
          className="select__item-indicator"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20,6 9,17 4,12" />
        </svg>
      )}
    </div>
  );
};
