import { VALIDATION_RULES } from '../config/constants';
import { AdminRegistrationData } from '../types';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Field validation functions
export const validators = {
  // Email validation
  email: (value: string): ValidationResult => {
    if (!value?.trim()) {
      return { isValid: false, error: 'Email is required' };
    }
    
    if (!VALIDATION_RULES.EMAIL.PATTERN.test(value.trim())) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    return { isValid: true };
  },

  // Password validation
  password: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'Password is required' };
    }
    
    if (value.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
      return { 
        isValid: false, 
        error: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters long` 
      };
    }
    
    if (!VALIDATION_RULES.PASSWORD.PATTERN.test(value)) {
      return { 
        isValid: false, 
        error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
      };
    }
    
    return { isValid: true };
  },

  // Confirm password validation
  confirmPassword: (value: string, originalPassword: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'Please confirm your password' };
    }
    
    if (value !== originalPassword) {
      return { isValid: false, error: 'Passwords do not match' };
    }
    
    return { isValid: true };
  },

  // Required text field validation
  required: (value: string, fieldName: string): ValidationResult => {
    if (!value?.trim()) {
      return { isValid: false, error: `${fieldName} is required` };
    }
    
    return { isValid: true };
  },

  // Name validation with length check
  name: (value: string, fieldName: string, required: boolean = true): ValidationResult => {
    if (!value?.trim()) {
      if (required) {
        return { isValid: false, error: `${fieldName} is required` };
      }
      return { isValid: true };
    }
    
    if (value.trim().length > VALIDATION_RULES.NAME.MAX_LENGTH) {
      return { 
        isValid: false, 
        error: `${fieldName} must not exceed ${VALIDATION_RULES.NAME.MAX_LENGTH} characters` 
      };
    }
    
    return { isValid: true };
  },

  // Phone number validation (optional) - Numbers only
  phoneNumber: (value: string): ValidationResult => {
    if (!value?.trim()) {
      return { isValid: true }; // Optional field
    }

    const phonePattern = /^\d+$/; // Only digits allowed
    if (!phonePattern.test(value.trim())) {
      return { isValid: false, error: 'Phone number must contain only numbers' };
    }

    if (value.trim().length < 10 || value.trim().length > 11) {
      return { isValid: false, error: 'Phone number must be 11 digits long' };
    }

    return { isValid: true };
  },

  // Department/Position validation
  department: (value: string): ValidationResult => {
    if (!value?.trim()) {
      return { isValid: false, error: 'Department is required' };
    }
    
    if (value.trim().length > 100) {
      return { isValid: false, error: 'Department must not exceed 100 characters' };
    }
    
    return { isValid: true };
  },

  position: (value: string): ValidationResult => {
    if (!value?.trim()) {
      return { isValid: false, error: 'Position is required' };
    }
    
    if (value.trim().length > 100) {
      return { isValid: false, error: 'Position must not exceed 100 characters' };
    }
    
    return { isValid: true };
  },

  // OTP validation
  otp: (value: string): ValidationResult => {
    if (!value?.trim()) {
      return { isValid: false, error: 'OTP is required' };
    }
    
    if (!VALIDATION_RULES.OTP.PATTERN.test(value.trim())) {
      return { isValid: false, error: 'Please enter a valid 6-digit OTP' };
    }
    
    return { isValid: true };
  },
};

// Form validation schemas
export interface AdminRegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  middleName: string;
  suffix: string;
  phoneNumber: string;
  department: string;
  position: string;
  gradeLevel: string;
}

export interface FormErrors {
  [key: string]: string;
}

// Validate entire registration form
export const validateRegistrationForm = (data: AdminRegistrationFormData): FormErrors => {
  const errors: FormErrors = {};

  // Email validation
  const emailResult = validators.email(data.email);
  if (!emailResult.isValid) {
    errors.email = emailResult.error!;
  }

  // Password validation
  const passwordResult = validators.password(data.password);
  if (!passwordResult.isValid) {
    errors.password = passwordResult.error!;
  }

  // Confirm password validation
  const confirmPasswordResult = validators.confirmPassword(data.confirmPassword, data.password);
  if (!confirmPasswordResult.isValid) {
    errors.confirmPassword = confirmPasswordResult.error!;
  }

  // Name validations
  const firstNameResult = validators.name(data.firstName, 'First name');
  if (!firstNameResult.isValid) {
    errors.firstName = firstNameResult.error!;
  }

  const lastNameResult = validators.name(data.lastName, 'Last name');
  if (!lastNameResult.isValid) {
    errors.lastName = lastNameResult.error!;
  }

  const middleNameResult = validators.name(data.middleName, 'Middle name', false);
  if (!middleNameResult.isValid) {
    errors.middleName = middleNameResult.error!;
  }

  // Phone number validation (optional)
  const phoneResult = validators.phoneNumber(data.phoneNumber);
  if (!phoneResult.isValid) {
    errors.phoneNumber = phoneResult.error!;
  }

  // Department validation
  const departmentResult = validators.department(data.department);
  if (!departmentResult.isValid) {
    errors.department = departmentResult.error!;
  }

  // Position validation
  const positionResult = validators.position(data.position);
  if (!positionResult.isValid) {
    errors.position = positionResult.error!;
  }

  return errors;
};

// Validate OTP form
export const validateOtpForm = (otp: string): FormErrors => {
  const errors: FormErrors = {};
  
  const otpResult = validators.otp(otp);
  if (!otpResult.isValid) {
    errors.otp = otpResult.error!;
  }
  
  return errors;
};

// Utility to check if form has errors
export const hasFormErrors = (errors: FormErrors): boolean => {
  return Object.keys(errors).length > 0;
};

// Utility to clean form data
export const cleanFormData = (data: AdminRegistrationFormData): AdminRegistrationData => {
  return {
    email: data.email.trim().toLowerCase(),
    password: data.password,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    middleName: data.middleName?.trim() || undefined,
    suffix: data.suffix?.trim() || undefined,
    phoneNumber: data.phoneNumber?.trim() || undefined,
    department: data.department?.trim() || undefined,
    position: data.position?.trim() || undefined,
    gradeLevel: data.gradeLevel?.trim() || undefined,
  };
};
