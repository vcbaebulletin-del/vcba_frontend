import React, { useState } from 'react';
import { Edit, Trash2, Eye, EyeOff, User, Mail, Phone, Calendar, Shield } from 'lucide-react';
import { AdminAccount } from '../../types/admin.types';
import { getImageUrl } from '../../config/constants';

// Helper function to get profile picture URL with fallback support
const getProfilePictureUrl = (profile: any) => {
  const profilePicture = profile.profile_picture || profile.profilePicture;
  const url = getImageUrl(profilePicture);

  // Debug logging for profile picture URLs
  if (profilePicture && process.env.NODE_ENV === 'development') {
    console.log('Profile picture debug:', {
      originalPath: profilePicture,
      constructedUrl: url
    });
  }

  return url;
};

interface AdminAccountListProps {
  admins: AdminAccount[];
  loading: boolean;
  onEdit: (admin: AdminAccount) => void;
  onToggleStatus: (adminId: number) => void;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  activeRole: 'super_admin' | 'professor';
}

const AdminAccountList: React.FC<AdminAccountListProps> = ({
  admins,
  loading,
  onEdit,
  onToggleStatus,
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
  activeRole
}) => {
  const [selectedAdmin, setSelectedAdmin] = useState<AdminAccount | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Filter admins based on navigation selection (only active accounts)
  const filteredAdmins = React.useMemo(() => {
    return admins.filter(admin => {
      const roleMatch = admin.profile.position === activeRole;
      const statusMatch = admin.is_active; // Only show active accounts
      return roleMatch && statusMatch;
    });
  }, [admins, activeRole]);

  const getPositionBadgeColor = (position: string) => {
    switch (position) {
      case 'super_admin': return '#dc2626';
      case 'professor': return '#2563eb';
      default: return '#6b7280';
    }
  };

  const getPositionDisplayName = (position: string) => {
    switch (position) {
      case 'super_admin': return 'Super Admin';
      case 'professor': return 'Professor';
      default: return position;
    }
  };

  const handleDeleteClick = (admin: AdminAccount) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedAdmin) {
      setShowDeleteModal(false);
      setSelectedAdmin(null);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div>

      {/* Admin List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredAdmins.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <User size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: '600' }}>
              No active {activeRole === 'super_admin' ? 'super admins' : 'professors'} found
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              {activeRole === 'super_admin' ? 'There are no active super admin' : 'There are no active professor'} accounts at the moment.
            </p>
          </div>
        ) : (
          filteredAdmins.map((admin) => (
            <div
              key={admin.admin_id}
              style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                padding: '1rem',
                transition: 'all 0.2s ease',
                opacity: admin.is_active ? 1 : 0.7
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Admin Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  {/* Profile Picture */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getProfilePictureUrl(admin.profile) ? (
                      <img
                        src={getProfilePictureUrl(admin.profile) || ''}
                        alt={`${admin.profile.full_name} profile`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          position: 'absolute',
                          top: 0,
                          left: 0
                        }}
                        onError={(e) => {
                          console.error('Failed to load profile picture:', getProfilePictureUrl(admin.profile));
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Profile picture loaded successfully:', getProfilePictureUrl(admin.profile));
                        }}
                      />
                    ) : null}
                    {!getProfilePictureUrl(admin.profile) && (
                      <User size={18} color="white" />
                    )}
                  </div>

                  {/* Name and Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1f2937'
                      }}>
                        {admin.profile.full_name}
                      </h3>

                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: getPositionBadgeColor(admin.profile.position),
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {getPositionDisplayName(admin.profile.position)}
                      </span>

                      {admin.profile.position === 'professor' && admin.profile.grade_level && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: '#f3f4f6',
                          color: '#6b7280',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          Grade {admin.profile.grade_level}
                        </span>
                      )}

                      {!admin.is_active && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: '#ef4444',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          INACTIVE
                        </span>
                      )}
                    </div>
                    
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: '#6b7280', 
                      marginTop: '0.25rem' 
                    }}>
                      {admin.email}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => onEdit(admin)}
                    title="Edit Admin"
                    style={{
                      padding: '0.5rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => {
                      if (admin.admin_id) {
                        if (admin.is_active) {
                          // Confirm deactivation
                          const confirmed = window.confirm(
                            'Are you sure you want to deactivate this admin? They will no longer be able to access the system.'
                          );
                          if (confirmed) {
                            onToggleStatus(admin.admin_id);
                          }
                        } else {
                          // No confirmation needed for activation
                          onToggleStatus(admin.admin_id);
                        }
                      }
                    }}
                    title={admin.is_active ? 'Deactivate Admin' : 'Activate Admin'}
                    style={{
                      padding: '0.5rem',
                      background: admin.is_active ? '#f59e0b' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s'
                    }}
                  >
                    {admin.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {Math.ceil(totalItems / itemsPerPage) > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '2rem',
          padding: '1rem'
        }}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === 1 ? '#f3f4f6' : '#3b82f6',
              color: currentPage === 1 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Previous
          </button>
          
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {Array.from({ length: Math.min(5, Math.ceil(totalItems / itemsPerPage)) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: currentPage === page ? '#3b82f6' : 'white',
                    color: currentPage === page ? 'white' : '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  {page}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === Math.ceil(totalItems / itemsPerPage)}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === Math.ceil(totalItems / itemsPerPage) ? '#f3f4f6' : '#3b82f6',
              color: currentPage === Math.ceil(totalItems / itemsPerPage) ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === Math.ceil(totalItems / itemsPerPage) ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAdmin && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              margin: '0 0 1rem',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#dc2626'
            }}>
              Delete Admin Account
            </h3>
            
            <p style={{ margin: '0 0 1.5rem', color: '#6b7280' }}>
              Are you sure you want to delete <strong>{selectedAdmin.profile.full_name}</strong>? 
              This action will deactivate their account and cannot be undone.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={confirmDelete}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccountList;
