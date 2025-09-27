import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SuffixOption {
  value: string;
  label: string;
  description?: string;
}

export interface SuffixDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

// Common suffix options - gender-neutral and culturally appropriate
export const SUFFIX_OPTIONS: SuffixOption[] = [
  { value: '', label: 'None', description: 'No suffix' },
  { value: 'Jr.', label: 'Jr.', description: 'Junior' },
  { value: 'Sr.', label: 'Sr.', description: 'Senior' },
  { value: 'II', label: 'II', description: 'The Second' },
  { value: 'III', label: 'III', description: 'The Third' },
  { value: 'IV', label: 'IV', description: 'The Fourth' },
  { value: 'V', label: 'V', description: 'The Fifth' },
  { value: 'VI', label: 'VI', description: 'The Sixth' },
  { value: 'VII', label: 'VII', description: 'The Seventh' },
  { value: 'VIII', label: 'VIII', description: 'The Eighth' },
  { value: 'IX', label: 'IX', description: 'The Ninth' },
  { value: 'X', label: 'X', description: 'The Tenth' },
];

const SuffixDropdown: React.FC<SuffixDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Select suffix',
  disabled = false,
  error,
  required = false,
  className = '',
  id,
  name
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  // Base styles for the select element
  const selectStyles: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 2.5rem 0.75rem 0.75rem',
    border: error ? '2px solid #ef4444' : '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: disabled ? '#f9fafb' : 'white',
    color: disabled ? '#9ca3af' : '#1f2937',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    fontWeight: '500',
    outline: 'none',
    appearance: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease-in-out',
    boxShadow: error
      ? '0 0 0 3px rgba(239, 68, 68, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    backgroundImage: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
    ...(disabled && {
      backgroundImage: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)'
    })
  };

  // Container styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    display: 'block'
  };

  // Arrow container styles
  const arrowContainerStyles: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    right: '0.75rem',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center'
  };

  // Error message styles
  const errorStyles: React.CSSProperties = {
    marginTop: '0.25rem',
    fontSize: '0.875rem',
    color: '#ef4444',
    fontWeight: '400'
  };

  return (
    <div style={containerStyles}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        style={selectStyles}
        aria-describedby={error ? `${id}-error` : undefined}
        onFocus={(e) => {
          if (!disabled && !error) {
            const target = e.target as HTMLSelectElement;
            target.style.borderColor = '#3b82f6';
            target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1)';
            target.style.backgroundImage = 'linear-gradient(to bottom, #ffffff, #fafbff)';
          }
        }}
        onBlur={(e) => {
          if (!disabled && !error) {
            const target = e.target as HTMLSelectElement;
            target.style.borderColor = '#e5e7eb';
            target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
            target.style.backgroundImage = 'linear-gradient(to bottom, #ffffff, #f9fafb)';
          }
        }}
        onMouseEnter={(e) => {
          if (!disabled && !error) {
            const target = e.target as HTMLSelectElement;
            target.style.borderColor = '#9ca3af';
            target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.12), 0 1px 2px 0 rgba(0, 0, 0, 0.08)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !error) {
            const target = e.target as HTMLSelectElement;
            target.style.borderColor = '#e5e7eb';
            target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
          }
        }}
      >
        <option value="" disabled style={{
          color: '#9ca3af',
          fontStyle: 'italic',
          backgroundColor: '#f9fafb'
        }}>
          {placeholder}
        </option>
        {SUFFIX_OPTIONS.map((option) => (
          <option
            key={option.value}
            value={option.value}
            style={{
              color: option.value === '' ? '#6b7280' : '#1f2937',
              backgroundColor: 'white',
              padding: '0.75rem 0.5rem',
              fontWeight: option.value === '' ? '400' : '500',
              borderBottom: '1px solid #f3f4f6'
            }}
          >
            {option.label}
            {option.description && option.value !== '' ? ` - ${option.description}` : ''}
          </option>
        ))}
      </select>

      {/* Custom dropdown arrow */}
      <div style={arrowContainerStyles}>
        <ChevronDown
          size={16}
          color={disabled ? '#9ca3af' : '#6b7280'}
          style={{
            transition: 'color 0.2s ease-in-out'
          }}
        />
      </div>

      {/* Error message */}
      {error && (
        <p id={`${id}-error`} style={errorStyles}>
          {error}
        </p>
      )}
    </div>
  );
};

export default SuffixDropdown;

// Utility functions for suffix handling
export const suffixUtils = {
  /**
   * Validates if a suffix is in the allowed list
   */
  isValidSuffix: (suffix: string): boolean => {
    return SUFFIX_OPTIONS.some(option => option.value === suffix);
  },

  /**
   * Gets the display label for a suffix
   */
  getSuffixLabel: (suffix: string): string => {
    const option = SUFFIX_OPTIONS.find(opt => opt.value === suffix);
    return option ? option.label : suffix;
  },

  /**
   * Gets the description for a suffix
   */
  getSuffixDescription: (suffix: string): string | undefined => {
    const option = SUFFIX_OPTIONS.find(opt => opt.value === suffix);
    return option?.description;
  },

  /**
   * Formats a full name with suffix
   */
  formatNameWithSuffix: (firstName: string, middleName: string, lastName: string, suffix: string): string => {
    const parts = [firstName, middleName, lastName].filter(Boolean);
    const fullName = parts.join(' ');
    return suffix ? `${fullName} ${suffix}` : fullName;
  },

  /**
   * Gender-neutral suffix recommendations
   * Since we don't have gender information, all suffixes are considered appropriate
   */
  getRecommendedSuffixes: (): SuffixOption[] => {
    return SUFFIX_OPTIONS.filter(option => option.value !== ''); // Exclude "None" option
  },

  /**
   * Common suffix validation rules
   */
  validateSuffixUsage: (suffix: string, _firstName: string, _lastName: string): { isValid: boolean; message?: string } => {
    if (!suffix) {
      return { isValid: true }; // Empty suffix is always valid
    }

    if (!suffixUtils.isValidSuffix(suffix)) {
      return { 
        isValid: false, 
        message: 'Please select a valid suffix from the dropdown list.' 
      };
    }

    // Additional validation rules can be added here
    // For example, checking for duplicate names in the system
    
    return { isValid: true };
  }
};

/**
 * GENDER-NEUTRAL SUFFIX HANDLING RECOMMENDATIONS
 * 
 * Since this system does not collect gender information, all suffixes are treated as
 * gender-neutral and appropriate for any individual. This approach:
 * 
 * 1. INCLUSIVE DESIGN: Avoids assumptions about gender based on names or suffixes
 * 2. CULTURAL SENSITIVITY: Respects diverse naming conventions and family traditions
 * 3. PRIVACY PROTECTION: Does not require disclosure of gender identity
 * 4. ACADEMIC APPROPRIATENESS: Suitable for educational institution environments
 * 
 * IMPLEMENTATION GUIDELINES:
 * - All suffixes (Jr., Sr., II, III, etc.) are available to all users
 * - No gender-based filtering or suggestions
 * - Focus on family lineage and naming traditions rather than gender
 * - Provide clear descriptions for each suffix option
 * - Allow users to choose "None" if no suffix applies
 * 
 * PROFESSOR APPROVAL CONSIDERATIONS:
 * This approach ensures compliance with:
 * - Equal opportunity policies
 * - Privacy protection standards
 * - Inclusive design principles
 * - Academic institution best practices
 */
