import React, { useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { usePermissions } from '../../utils/permissions';
import { User, Settings as SettingsIcon, Lock, Bell, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';
import ProfilePictureUpload from '../../components/admin/ProfilePictureUpload';
import { AdminAuthService } from '../../services/admin-auth.service';
import { API_BASE_URL } from '../../config/constants';

const Settings: React.FC = () => {
  const { user, checkAuthStatus } = useAdminAuth();
  const permissions = usePermissions(user);
  // Removed activeTab state - showing profile settings directly
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Removed tabs - showing profile settings directly

  // Profile picture handlers
  const handleProfilePictureUpload = async (file: File) => {
    setIsUploadingPicture(true);
    try {
      console.log('🔍 Settings - Starting profile picture upload...');
      const result = await AdminAuthService.uploadProfilePicture(file);
      console.log('🔍 Settings - Upload result:', result);

      // Refresh user data to get updated profile picture
      console.log('🔍 Settings - Refreshing auth status...');
      await checkAuthStatus();
      console.log('🔍 Settings - Auth status refreshed, new user:', user);
    } catch (error: any) {
      console.error('❌ Settings - Upload failed:', error);
      throw new Error(error.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleProfilePictureRemove = async () => {
    setIsUploadingPicture(true);
    try {
      await AdminAuthService.removeProfilePicture();
      // Refresh user data to remove profile picture
      await checkAuthStatus();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to remove profile picture');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  // Password validation
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    return errors;
  };

  // Handle password input change
  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    setPasswordErrors([]);
    setPasswordSuccess(null);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Handle password change submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors([]);
    setPasswordSuccess(null);

    // Validation
    const errors: string[] = [];

    if (!passwordData.currentPassword) {
      errors.push('Current password is required');
    }

    if (!passwordData.newPassword) {
      errors.push('New password is required');
    } else {
      const passwordValidationErrors = validatePassword(passwordData.newPassword);
      errors.push(...passwordValidationErrors);
    }

    if (!passwordData.confirmPassword) {
      errors.push('Password confirmation is required');
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.push('New password and confirmation do not match');
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.push('New password must be different from current password');
    }

    if (errors.length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsChangingPassword(true);
    try {
      // Call API to change password
      await AdminAuthService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Clear success message after 5 seconds
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (error: any) {
      setPasswordErrors([error.message || 'Failed to change password']);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const renderProfileSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Profile Information Section */}
      <div className="settings-card hover-lift" style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e8f5e8'
      }}>

        {/* Horizontal Layout: Profile Picture + Profile Details */}
        <div className="profile-layout" style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          {/* Profile Picture (Left Side) */}
          <div style={{ flexShrink: 0 }}>
            <ProfilePictureUpload
              currentPicture={user?.profilePicture ? `${API_BASE_URL}${user.profilePicture}` : undefined}
              userInitials={`${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`}
              onUpload={handleProfilePictureUpload}
              onRemove={handleProfilePictureRemove}
              isLoading={isUploadingPicture}
              size={140}
            />
          </div>

          {/* Profile Details (Right Side) */}
          <div className="profile-details" style={{
            flex: 1,
            minWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            paddingTop: '0.5rem'
          }}>
            {/* Name */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                color: '#111827',
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '0.5rem'
              }}>
                {`${user?.firstName || ''} ${user?.lastName || ''}`}
                {user?.suffix && <span style={{ fontWeight: '400', color: '#6b7280' }}> {user.suffix}</span>}
              </div>
              <div style={{
                color: '#6b7280',
                fontSize: '1rem',
                fontWeight: '500'
              }}>
                  <span>{user?.email || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Section */}
      <div className="settings-card hover-lift" style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e8f5e8'
      }}>
        <h3 style={{
          margin: '0 0 1.5rem 0',
          color: '#2d5016',
          fontSize: '1.25rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Lock size={20} />
          Change Password
        </h3>

        <form onSubmit={handlePasswordSubmit}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Current Password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Current Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 3rem 0.75rem 1rem',
                    border: '2px solid #e8f5e8',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                  onBlur={(e) => e.target.style.borderColor = '#e8f5e8'}
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '0.25rem'
                  }}
                >
                  {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 3rem 0.75rem 1rem',
                    border: '2px solid #e8f5e8',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                  onBlur={(e) => e.target.style.borderColor = '#e8f5e8'}
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '0.25rem'
                  }}
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 3rem 0.75rem 1rem',
                    border: '2px solid #e8f5e8',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                  onBlur={(e) => e.target.style.borderColor = '#e8f5e8'}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '0.25rem'
                  }}
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <h4 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#16a34a'
              }}>
                Password Requirements:
              </h4>
              <ul style={{
                margin: 0,
                paddingLeft: '1.25rem',
                fontSize: '0.75rem',
                color: '#16a34a',
                lineHeight: '1.5'
              }}>
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
                <li>Contains at least one special character (@$!%*?&)</li>
              </ul>
            </div>

            {/* Error Messages */}
            {passwordErrors.length > 0 && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <AlertCircle size={16} color="#dc2626" />
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#dc2626'
                  }}>
                    Please fix the following errors:
                  </span>
                </div>
                <ul style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  fontSize: '0.75rem',
                  color: '#dc2626',
                  lineHeight: '1.5'
                }}>
                  {passwordErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success Message */}
            {passwordSuccess && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle size={16} color="#16a34a" />
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#16a34a'
                }}>
                  {passwordSuccess}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isChangingPassword}
              style={{
                background: isChangingPassword
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.875rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: isChangingPassword ? 'none' : '0 2px 8px rgba(34, 197, 94, 0.2)',
                alignSelf: 'flex-start'
              }}
              onMouseEnter={(e) => {
                if (!isChangingPassword) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isChangingPassword) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.2)';
                }
              }}
            >
              {isChangingPassword ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Changing Password...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Removed renderSystemSettings function - showing profile settings directly

  // Removed renderContent function - showing profile settings directly

  return (
    <div>
      {/* CSS for responsive design and animations */}
      <style>{`
        @media (max-width: 768px) {
          .profile-layout {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center;
          }

          .profile-details {
            min-width: unset !important;
            width: 100% !important;
          }

          .profile-grid {
            grid-template-columns: 1fr !important;
          }

          .role-status-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .settings-container {
            padding: 1rem !important;
          }

          .settings-card {
            padding: 1.5rem !important;
          }

          .tab-container {
            padding: 1rem !important;
          }

          .tab-button {
            padding: 0.5rem 1rem !important;
            font-size: 0.875rem !important;
          }
        }

        .fade-in {
          animation: fadeInUp 0.5s ease-out;
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hover-lift {
          transition: all 0.3s ease;
        }

        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12) !important;
        }
      `}</style>

      {/* Profile Settings Content - Direct Display */}
      <div className="fade-in">
        {renderProfileSettings()}
      </div>
    </div>
  );
};

export default Settings;
