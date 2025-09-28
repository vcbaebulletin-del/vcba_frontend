import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Building, GraduationCap, FileText, Eye, EyeOff } from 'lucide-react';
import ProfilePictureUpload from './ProfilePictureUpload';
import SuffixDropdown, { suffixUtils } from '../common/SuffixDropdown';
import { AdminAuthService } from '../../services/admin-auth.service';
import { adminManagementService } from '../../services/adminManagementService';
import { AdminAccount, AdminFormData, AdminFormErrors } from '../../types/admin.types';
import { API_BASE_URL } from '../../config/constants';

interface AdminAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (adminData: AdminAccount) => Promise<void>;
  admin?: AdminAccount | null;
  loading?: boolean;
}

const AdminAccountModal: React.FC<AdminAccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  admin,
  loading = false
}) => {
  const [formData, setFormData] = useState<AdminFormData>({
    email: '',
    is_active: true,
    profile: {
      first_name: '',
      middle_name: null,
      last_name: '',
      suffix: null,
      full_name: '',
      phone_number: null,
      position: 'professor',
      grade_level: null,
      profile_picture: null
    }
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<AdminFormErrors>({});
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  const isEditing = !!admin?.admin_id;

  useEffect(() => {
    if (admin) {
      setFormData(admin);
    } else {
      // Reset form for new admin
      setFormData({
        email: '',
        is_active: true,
        profile: {
          first_name: '',
          middle_name: null,
          last_name: '',
          suffix: null,
          full_name: '',
          phone_number: null,
          position: 'professor',
          grade_level: null,
          profile_picture: null
        }
      });
    }
    setPassword('');
    setConfirmPassword('');
    setErrors({});
  }, [admin, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation (only for new admins)
    if (!isEditing) {
      if (!password.trim()) {
        newErrors.password = 'Password is required';
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Name validation
    if (!formData.profile.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.profile.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    // Phone number validation
    if (!formData.profile.phone_number || !formData.profile.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (formData.profile.phone_number.length !== 11) {
      newErrors.phone_number = 'Phone number must be exactly 11 digits';
    } else if (!/^09\d{9}$/.test(formData.profile.phone_number)) {
      newErrors.phone_number = 'Phone number must start with 09 and contain only digits';
    }

    // Grade level validation for professors
    if (formData.profile.position === 'professor' && !formData.profile.grade_level) {
      newErrors.grade_level = 'Grade level is required for professors';
    }

    // Suffix validation
    if (formData.profile.suffix) {
      const suffixValidation = suffixUtils.validateSuffixUsage(
        formData.profile.suffix,
        formData.profile.first_name,
        formData.profile.last_name
      );
      if (!suffixValidation.isValid) {
        newErrors.suffix = suffixValidation.message || 'Invalid suffix';
      }
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.isValid) {
      // Show alert with validation errors
      const errorMessages = Object.values(validation.errors).filter(Boolean);
      alert(`Please fix the following errors:\n\n${errorMessages.join('\n')}`);
      return;
    }

    try {
      const adminData = { ...formData };

      // Generate full_name from individual name components
      const fullNameParts = [
        adminData.profile.first_name,
        adminData.profile.middle_name,
        adminData.profile.last_name,
        adminData.profile.suffix
      ].filter(Boolean);

      adminData.profile.full_name = fullNameParts.join(' ');

      // Ensure grade_level is null for super admins
      if (adminData.profile.position === 'super_admin') {
        adminData.profile.grade_level = null;
      }

      if (!isEditing) {
        // Add password for new admins
        (adminData as any).password = password;
      }

      await onSave(adminData);
      onClose();
    } catch (error) {
      console.error('Error saving admin:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('profile.')) {
      const profileField = field.replace('profile.', '');
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    // Handle both nested field names (profile.first_name) and simple field names (first_name)
    const errorKey = field.startsWith('profile.') ? field.replace('profile.', '') : field;
    if (errors[field] || errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
        [errorKey]: ''
      }));
    }
  };

  // Profile picture handlers (only for editing existing admins)
  const handleProfilePictureUpload = async (file: File) => {
    if (!isEditing || !admin?.admin_id) {
      throw new Error('Profile picture can only be uploaded for existing admin accounts');
    }

    setIsUploadingPicture(true);
    try {
      // Use the adminManagementService to upload profile picture
      const response = await adminManagementService.uploadProfilePicture(admin.admin_id, file);

      // Update the form data with the new profile picture
      // Handle both snake_case and camelCase responses from backend
      const profilePicture = response.data?.admin?.profile?.profile_picture ||
                           response.data?.admin?.profile?.profilePicture ||
                           response.data?.profilePicture ||
                           null;

      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          profile_picture: profilePicture
        }
      }));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleProfilePictureRemove = async () => {
    if (!isEditing || !admin?.admin_id) {
      throw new Error('Profile picture can only be removed for existing admin accounts');
    }

    setIsUploadingPicture(true);
    try {
      // Use the adminManagementService to remove profile picture
      await adminManagementService.removeProfilePicture(admin.admin_id);

      // Update the form data to remove the profile picture
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          profile_picture: null
        }
      }));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to remove profile picture');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            {isEditing ? 'Edit Admin Account' : 'Add New Admin'}
          </h2>
          
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
          {/* Profile Picture Upload (only for editing existing admins) */}
          {isEditing && (
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <h3 style={{
                margin: '0 0 1rem 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Profile Picture
              </h3>
              <ProfilePictureUpload
                currentPicture={formData.profile.profile_picture ? `${API_BASE_URL}${formData.profile.profile_picture}` : undefined}
                userInitials={`${formData.profile.first_name?.charAt(0) || ''}${formData.profile.last_name?.charAt(0) || ''}`}
                onUpload={handleProfilePictureUpload}
                onRemove={handleProfilePictureRemove}
                isLoading={isUploadingPicture}
                size={100}
              />
              <p style={{
                margin: '0.5rem 0 0 0',
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                Profile pictures can only be managed for existing admin accounts
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {/* Email */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                <Mail size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.email ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
                placeholder="admin@example.com"
              />
              {errors.email && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Position */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                <User size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Position *
              </label>
              <select
                value={formData.profile.position}
                onChange={(e) => handleInputChange('profile.position', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              >
                <option value="professor">Professor</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            {/* First Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                First Name *
              </label>
              <input
                type="text"
                value={formData.profile.first_name}
                onChange={(e) => handleInputChange('profile.first_name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.first_name ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
                placeholder="John"
              />
              {errors.first_name && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                  {errors.first_name}
                </p>
              )}
            </div>

            {/* Middle Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Middle Name
              </label>
              <input
                type="text"
                value={formData.profile.middle_name || ''}
                onChange={(e) => handleInputChange('profile.middle_name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
                placeholder="Michael"
              />
            </div>

            {/* Last Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Last Name *
              </label>
              <input
                type="text"
                value={formData.profile.last_name}
                onChange={(e) => handleInputChange('profile.last_name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.last_name ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
                placeholder="Doe"
              />
              {errors.last_name && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                  {errors.last_name}
                </p>
              )}
            </div>

            {/* Suffix */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Suffix
              </label>
              <SuffixDropdown
                value={formData.profile.suffix || ''}
                onChange={(value) => handleInputChange('profile.suffix', value || null)}
                placeholder="Select suffix (optional)"
                error={errors.suffix}
                id="admin-suffix"
                name="suffix"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                <Phone size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.profile.phone_number || ''}
                onChange={(e) => handleInputChange('profile.phone_number', e.target.value)}
                onInput={(e) => {
                  // Allow only numbers and limit to 11 digits
                  e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 11);
                }}
                maxLength={11}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.phone_number ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
                placeholder="09XXXXXXXXX"
              />
              {errors.phone_number && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                  {errors.phone_number}
                </p>
              )}
            </div>



            {/* Grade Level (for professors) */}
            {formData.profile.position === 'professor' && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  <GraduationCap size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Grade Level *
                </label>
                <select
                  value={formData.profile.grade_level || ''}
                  onChange={(e) => handleInputChange('profile.grade_level', e.target.value ? Number(e.target.value) : undefined)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${errors.grade_level ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Select Grade Level</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>
                {errors.grade_level && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                    {errors.grade_level}
                  </p>
                )}
              </div>
            )}

            {/* Password (only for new admins) */}
            {!isEditing && (
              <>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        paddingRight: '2.5rem',
                        border: `1px solid ${errors.password ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.confirmPassword ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Confirm password"
                  />
                  {errors.confirmPassword && (
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>



          {/* Form Actions */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f3f4f6',
                color: '#6b7280',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading && (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              )}
              {loading ? 'Saving...' : (isEditing ? 'Update Admin' : 'Create Admin')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAccountModal;