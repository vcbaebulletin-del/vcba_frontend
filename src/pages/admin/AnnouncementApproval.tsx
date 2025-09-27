import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, Search, Clock, User, Calendar, AlertCircle, Eye } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { usePermissions } from '../../utils/permissions';
import { adminAnnouncementService, Announcement } from '../../services/announcementService';
import AnnouncementViewDialog from '../../components/admin/modals/AnnouncementViewDialog';

const AnnouncementApproval: React.FC = () => {
  // Add CSS animation for spinner
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const { user } = useAdminAuth();
  const permissions = usePermissions(user);
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // View dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  // Load pending announcements
  const loadPendingAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminAnnouncementService.getPendingAnnouncements({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm
      });

      if (response.success && response.data) {
        setAnnouncements(response.data.announcements);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.totalItems);
      } else {
        throw new Error(response.message || 'Failed to load pending announcements');
      }
    } catch (err: any) {
      console.error('Error loading pending announcements:', err);
      setError(err.message || 'Failed to load pending announcements');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    if (!permissions.isSuperAdmin) {
      setError('You do not have permission to access this page');
      setLoading(false);
      return;
    }
    loadPendingAnnouncements();
  }, [permissions.isSuperAdmin, loadPendingAnnouncements]);

  // Handle approval
  const handleApprove = async (announcementId: number) => {
    if (window.confirm('Are you sure you want to approve this announcement? Once approved, it will be visible to all users.')) {
      try {
        setActionLoading(announcementId);
        const response = await adminAnnouncementService.approveAnnouncement(announcementId);
        
        if (response.success) {
          // Remove from pending list
          setAnnouncements(prev => prev.filter(a => a.announcement_id !== announcementId));
          setTotalItems(prev => prev - 1);
        } else {
          throw new Error(response.message || 'Failed to approve announcement');
        }
      } catch (err: any) {
        console.error('Error approving announcement:', err);
        setError(err.message || 'Failed to approve announcement');
      } finally {
        setActionLoading(null);
      }
    }
  };

  // Handle rejection without reason
  const handleRejectDirect = async (announcementId: number) => {
    if (window.confirm('Are you sure you want to reject this announcement? This action cannot be undone.')) {
      try {
        setActionLoading(announcementId);
        const response = await adminAnnouncementService.rejectAnnouncement(announcementId);

        if (response.success) {
          // Remove from pending list
          setAnnouncements(prev => prev.filter(a => a.announcement_id !== announcementId));
          setTotalItems(prev => prev - 1);
        } else {
          throw new Error(response.message || 'Failed to reject announcement');
        }
      } catch (err: any) {
        console.error('Error rejecting announcement:', err);
        setError(err.message || 'Failed to reject announcement');
      } finally {
        setActionLoading(null);
      }
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle view announcement
  const handleViewAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setViewDialogOpen(true);
  };

  // Handle close view dialog
  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedAnnouncement(null);
  };

  if (!permissions.isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div>

      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>

        {/* Search and Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#9ca3af'
            }} />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.5rem',
                paddingRight: '1rem',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Items per page controller */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
              Show:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                minWidth: '70px'
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '2px solid #fecaca',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle style={{ width: '24px', height: '24px', color: '#ef4444' }} />
            <p style={{
              color: '#b91c1c',
              margin: 0,
              fontSize: '1rem',
              fontWeight: '500'
            }}>
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 0',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #22c55e',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{
              color: '#6b7280',
              fontSize: '1rem',
              fontWeight: '500',
              margin: 0
            }}>
              Loading announcements...
            </p>
          </div>
        </div>
      ) : announcements.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <Clock style={{
            width: '80px',
            height: '80px',
            color: '#22c55e',
            margin: '0 auto 1.5rem',
            opacity: 0.7
          }} />
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '0.75rem',
            margin: '0 0 0.75rem 0'
          }}>
            No Pending Announcements
          </h3>
          <p style={{
            color: '#6b7280',
            fontSize: '1rem',
            margin: 0,
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            All posts have been reviewed. New submissions will appear here for approval.
          </p>
        </div>
      ) : (
        <>
          {/* Announcements Table */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            marginBottom: '1.5rem'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 150px 120px 100px 120px',
              gap: '1rem',
              padding: '1rem 1.5rem',
              background: '#f8fafc',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              <div>Title</div>
              <div>Author</div>
              <div>Created</div>
              <div>Type</div>
              <div style={{ textAlign: 'center' }}>Actions</div>
            </div>

            {/* Table Body */}
            {announcements.map((announcement) => (
              <div
                key={announcement.announcement_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 150px 120px 100px 120px',
                  gap: '1rem',
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'background-color 0.2s ease',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* Title and Content */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {announcement.title}
                    </h3>
                    {Boolean(announcement.is_alert) && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '12px',
                        fontSize: '0.625rem',
                        fontWeight: '600',
                        background: '#ef4444',
                        color: 'white'
                      }}>
                        ALERT
                      </span>
                    )}
                    {Boolean(announcement.is_pinned) && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '12px',
                        fontSize: '0.625rem',
                        fontWeight: '600',
                        background: '#3b82f6',
                        color: 'white'
                      }}>
                        PIN
                      </span>
                    )}
                  </div>
                  <p style={{
                    color: '#6b7280',
                    fontSize: '0.75rem',
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.4'
                  }}>
                    {announcement.content}
                  </p>
                </div>

                {/* Author */}
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {announcement.author_name}
                </div>

                {/* Created Date */}
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {formatDate(announcement.created_at!)}
                </div>

                {/* Type/Grade */}
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Grade {announcement.grade_level || 'All'}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleViewAnnouncement(announcement)}
                    title="View Details"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#3b82f6',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#3b82f6';
                    }}
                  >
                    <Eye style={{ width: '14px', height: '14px' }} />
                  </button>

                  <button
                    onClick={() => handleApprove(announcement.announcement_id)}
                    disabled={actionLoading === announcement.announcement_id}
                    title="Approve"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      border: 'none',
                      borderRadius: '6px',
                      background: actionLoading === announcement.announcement_id ? '#9ca3af' : '#22c55e',
                      color: 'white',
                      cursor: actionLoading === announcement.announcement_id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (actionLoading !== announcement.announcement_id) {
                        e.currentTarget.style.background = '#16a34a';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (actionLoading !== announcement.announcement_id) {
                        e.currentTarget.style.background = '#22c55e';
                      }
                    }}
                  >
                    {actionLoading === announcement.announcement_id ? (
                      <div style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid #ffffff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                    ) : (
                      <Check style={{ width: '14px', height: '14px' }} />
                    )}
                  </button>

                  <button
                    onClick={() => handleRejectDirect(announcement.announcement_id)}
                    disabled={actionLoading === announcement.announcement_id}
                    title="Reject"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      border: 'none',
                      borderRadius: '6px',
                      background: actionLoading === announcement.announcement_id ? '#9ca3af' : '#ef4444',
                      color: 'white',
                      cursor: actionLoading === announcement.announcement_id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (actionLoading !== announcement.announcement_id) {
                        e.currentTarget.style.background = '#dc2626';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (actionLoading !== announcement.announcement_id) {
                        e.currentTarget.style.background = '#ef4444';
                      }
                    }}
                  >
                    <X style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'white',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: currentPage === 1 ? '#9ca3af' : '#374151',
                    background: 'white',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Previous
                </button>
                <span style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  background: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0'
                }}>
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: currentPage === totalPages ? '#9ca3af' : '#374151',
                    background: 'white',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Rejection modal removed - direct rejection now used */}

      {/* View Dialog */}
      <AnnouncementViewDialog
        isOpen={viewDialogOpen}
        onClose={handleCloseViewDialog}
        announcement={selectedAnnouncement}
      />
    </div>
  );
};

export default AnnouncementApproval;
