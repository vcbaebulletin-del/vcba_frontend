/**
 * Form utility functions for consistent form handling across the application
 */

export interface FormField {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Creates FormData from form fields and files
 * @param formData - Object containing form field values
 * @param files - Array of files to append
 * @param options - Configuration options
 */
export const createFormData = (
  formData: FormField,
  files: File[] = [],
  options: {
    skipScheduledDate?: boolean;
    fileFieldName?: string;
  } = {}
): FormData => {
  const { skipScheduledDate = true, fileFieldName = 'images' } = options;
  const formDataToSubmit = new FormData();

  // Add all form fields with proper validation and transformation
  Object.entries(formData).forEach(([key, value]) => {
    if (key === 'category_id' && typeof value === 'string') {
      // category_id is required and must be a valid number
      const categoryId = parseInt(value);
      if (!isNaN(categoryId) && categoryId > 0) {
        formDataToSubmit.append(key, categoryId.toString());
      }
    } else if (key === 'subcategory_id' && typeof value === 'string') {
      // subcategory_id is optional - only append if it's a valid number
      if (value.trim() !== '') {
        const subcategoryId = parseInt(value);
        if (!isNaN(subcategoryId) && subcategoryId > 0) {
          formDataToSubmit.append(key, subcategoryId.toString());
        }
      }
      // If empty, don't append anything (backend will handle as null)
    } else if (key === 'scheduled_publish_at') {
      // Only include scheduled_publish_at if status is 'scheduled' and value is not empty
      if (formData.status === 'scheduled' && value && typeof value === 'string' && value.trim() !== '') {
        formDataToSubmit.append(key, value.trim());
      }
      // For non-scheduled announcements, don't include this field
    } else if (typeof value === 'boolean') {
      // Boolean fields - send as string representation of boolean for FormData
      formDataToSubmit.append(key, value.toString());
    } else if (value !== null && value !== undefined && value !== '') {
      // Regular fields - only append if they have actual content
      formDataToSubmit.append(key, value.toString().trim());
    }
  });

  // Add files
  if (files.length > 0) {
    files.forEach((file) => {
      formDataToSubmit.append(fileFieldName, file);
    });
  }

  return formDataToSubmit;
};

/**
 * Validates common form fields
 * @param formData - Form data to validate
 * @param rules - Validation rules
 */
export const validateFormFields = (
  formData: FormField,
  rules: {
    required?: string[];
    maxLength?: { [key: string]: number };
    custom?: { [key: string]: (value: any) => string | null };
  } = {}
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const { required = [], maxLength = {}, custom = {} } = rules;

  // Check required fields
  required.forEach(field => {
    const value = formData[field];
    if (!value || (typeof value === 'string' && !value.trim())) {
      errors[field] = `${field.replace('_', ' ')} is required`;
    }
  });

  // Check max length
  Object.entries(maxLength).forEach(([field, max]) => {
    const value = formData[field];
    if (typeof value === 'string' && value.length > max) {
      errors[field] = `${field.replace('_', ' ')} must be less than ${max} characters`;
    }
  });

  // Apply custom validation
  Object.entries(custom).forEach(([field, validator]) => {
    const value = formData[field];
    const error = validator(value);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

/**
 * Common validation rules for announcements
 */
export const announcementValidationRules = {
  required: ['title', 'content', 'category_id'],
  maxLength: { title: 255 },
  custom: {
    scheduled_publish_at: (value: any, formData?: FormField) => {
      if (formData?.status === 'scheduled' && !value) {
        return 'Scheduled publish date is required for scheduled announcements';
      }
      return null;
    }
  }
};

/**
 * Formats file size for display
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places
 */
export const formatFileSize = (bytes: number, decimals: number = 1): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Validates file type and size
 * @param file - File to validate
 * @param options - Validation options
 */
export const validateFile = (
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}
): string | null => {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] } = options;

  if (!allowedTypes.includes(file.type)) {
    return `File type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`;
  }

  if (file.size > maxSize) {
    return `File size ${formatFileSize(file.size)} exceeds maximum allowed size of ${formatFileSize(maxSize)}`;
  }

  return null;
};
