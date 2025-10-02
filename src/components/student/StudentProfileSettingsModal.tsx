import React, { useState, useEffect } from 'react';
import { getImageUrl, API_BASE_URL, STUDENT_AUTH_TOKEN_KEY } from '../../config/constants';
import type { User } from '../../types/auth.types';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface StudentProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

const StudentProfileSettingsModal: React.FC<StudentProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
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
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isOpen) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setPasswordLoading(true);

    try {
      const token = localStorage.getItem(STUDENT_AUTH_TOKEN_KEY);

      if (!token) {
        setPasswordError('Authentication required. Please log in again.');
        setPasswordLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/student/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordForm(false);

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setPasswordSuccess('');
        }, 3000);
      } else {
        if (response.status === 401) {
          setPasswordError('Authentication failed. Please log in again.');
        } else if (response.status === 400) {
          setPasswordError(data.error?.message || data.message || 'Invalid request');
        } else {
          setPasswordError(data.error?.message || data.message || 'Failed to change password');
        }
      }
    } catch (error) {
      setPasswordError('Network error. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
    setPasswordSuccess('');
    setShowPasswordForm(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '0.5rem' : '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            Profile Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0.5rem',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          display: 'flex',
          gap: isMobile ? '1rem' : '2rem',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'center' : 'flex-start'
        }}>
          {/* Profile Picture Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            minWidth: isMobile ? 'auto' : '200px'
          }}>
            {/* Profile Picture */}
            {currentUser?.profilePicture ? (
              <img
                src={getImageUrl(currentUser.profilePicture) || ''}
                alt={`${currentUser.firstName} ${currentUser.lastName}`}
                style={{
                  width: isMobile ? '120px' : '150px',
                  height: isMobile ? '120px' : '150px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid #e5e7eb'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div style="
                        width: ${isMobile ? '120px' : '150px'};
                        height: ${isMobile ? '120px' : '150px'};
                        border-radius: 50%;
                        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: 600;
                        font-size: ${isMobile ? '2.5rem' : '3rem'};
                        border: 4px solid #e5e7eb;
                      ">
                        ${currentUser?.firstName?.charAt(0) || ''}${currentUser?.lastName?.charAt(0) || ''}
                      </div>
                    `;
                  }
                }}
              />
            ) : (
              <div style={{
                width: isMobile ? '120px' : '150px',
                height: isMobile ? '120px' : '150px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: isMobile ? '2.5rem' : '3rem',
                border: '4px solid #e5e7eb'
              }}>
                {currentUser?.firstName?.charAt(0) || ''}{currentUser?.lastName?.charAt(0) || ''}
              </div>
            )}

            <div style={{
              textAlign: 'center'
            }}>
              <h3 style={{
                margin: '0 0 0.5rem 0',
                fontSize: isMobile ? '1rem' : '1.25rem',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                {currentUser?.firstName} {currentUser?.lastName}
              </h3>
              <p style={{
                margin: 0,
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                Student
              </p>
            </div>
          </div>

          {/* Information Section */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Personal Information */}
            <div>
              <h4 style={{
                margin: '0 0 1rem 0',
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: '600',
                color: '#1f2937',
                borderBottom: '2px solid #22c55e',
                paddingBottom: '0.5rem'
              }}>
                Personal Information
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    First Name
                  </label>
                  <div style={{
                    padding: isMobile ? '0.5rem' : '0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    color: '#1f2937'
                  }}>
                    {currentUser?.firstName || 'N/A'}
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    Last Name
                  </label>
                  <div style={{
                    padding: isMobile ? '0.5rem' : '0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    color: '#1f2937'
                  }}>
                    {currentUser?.lastName || 'N/A'}
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    Email
                  </label>
                  <div style={{
                    padding: isMobile ? '0.5rem' : '0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    color: '#1f2937'
                  }}>
                    {currentUser?.email || 'N/A'}
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    Student Number
                  </label>
                  <div style={{
                    padding: isMobile ? '0.5rem' : '0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    color: '#1f2937'
                  }}>
                    {currentUser?.studentNumber || 'N/A'}
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    Grade Level
                  </label>
                  <div style={{
                    padding: isMobile ? '0.5rem' : '0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    color: '#1f2937'
                  }}>
                    Grade {currentUser?.grade_level || 'N/A'}
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    Phone Number
                  </label>
                  <div style={{
                    padding: isMobile ? '0.5rem' : '0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    color: '#1f2937'
                  }}>
                    {currentUser?.phoneNumber || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Password Change Section */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <h4 style={{
                  margin: 0,
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  borderBottom: '2px solid #ef4444',
                  paddingBottom: '0.5rem'
                }}>
                  Change Password
                </h4>
                {!showPasswordForm && (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                    }}
                  >
                    <Lock size={14} />
                    Change Password
                  </button>
                )}
              </div>

              {/* Success Message */}
              {passwordSuccess && (
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  color: '#166534',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {passwordSuccess}
                </div>
              )}

              {!showPasswordForm ? (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: '#64748b'
                  }}>
                    Click "Change Password" to update your password securely.
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} style={{
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}>
                  {/* Error Message */}
                  {passwordError && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      marginBottom: '1rem',
                      color: '#dc2626',
                      fontSize: '0.875rem'
                    }}>
                      {passwordError}
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    {/* Current Password */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: isMobile ? '0.8rem' : '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>
                        Current Password *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({
                            ...prev,
                            currentPassword: e.target.value
                          }))}
                          style={{
                            width: '100%',
                            padding: isMobile ? '0.5rem' : '0.75rem',
                            paddingRight: '2.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: isMobile ? '0.8rem' : '0.875rem',
                            outline: 'none',
                            transition: 'border-color 0.2s ease'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({
                            ...prev,
                            current: !prev.current
                          }))}
                          style={{
                            position: 'absolute',
                            right: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#6b7280',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                        >
                          {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: isMobile ? '0.8rem' : '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>
                        New Password *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({
                            ...prev,
                            newPassword: e.target.value
                          }))}
                          style={{
                            width: '100%',
                            padding: isMobile ? '0.5rem' : '0.75rem',
                            paddingRight: '2.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: isMobile ? '0.8rem' : '0.875rem',
                            outline: 'none',
                            transition: 'border-color 0.2s ease'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }}
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({
                            ...prev,
                            new: !prev.new
                          }))}
                          style={{
                            position: 'absolute',
                            right: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#6b7280',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                        >
                          {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <p style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        color: '#6b7280'
                      }}>
                        Must be at least 6 characters long
                      </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: isMobile ? '0.8rem' : '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>
                        Confirm New Password *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({
                            ...prev,
                            confirmPassword: e.target.value
                          }))}
                          style={{
                            width: '100%',
                            padding: isMobile ? '0.5rem' : '0.75rem',
                            paddingRight: '2.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: isMobile ? '0.8rem' : '0.875rem',
                            outline: 'none',
                            transition: 'border-color 0.2s ease'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({
                            ...prev,
                            confirm: !prev.confirm
                          }))}
                          style={{
                            position: 'absolute',
                            right: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#6b7280',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                        >
                          {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div style={{
                      display: 'flex',
                      gap: '0.75rem',
                      marginTop: '0.5rem'
                    }}>
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        style={{
                          flex: 1,
                          padding: '0.75rem 1rem',
                          backgroundColor: passwordLoading ? '#9ca3af' : '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: passwordLoading ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!passwordLoading) {
                            e.currentTarget.style.backgroundColor = '#16a34a';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!passwordLoading) {
                            e.currentTarget.style.backgroundColor = '#22c55e';
                          }
                        }}
                      >
                        {passwordLoading ? 'Changing...' : 'Change Password'}
                      </button>
                      <button
                        type="button"
                        onClick={resetPasswordForm}
                        disabled={passwordLoading}
                        style={{
                          flex: 1,
                          padding: '0.75rem 1rem',
                          backgroundColor: 'transparent',
                          color: '#6b7280',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: passwordLoading ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!passwordLoading) {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                            e.currentTarget.style.color = '#374151';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!passwordLoading) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#6b7280';
                          }
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#16a34a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#22c55e';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileSettingsModal;