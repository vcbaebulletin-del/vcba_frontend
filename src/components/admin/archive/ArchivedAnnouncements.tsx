import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, RotateCcw, Trash2, User, Tag, AlertTriangle, Archive, UserX } from 'lucide-react';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { archiveService, ArchivedAnnouncement, ArchiveFilters, ArchivePagination } from '../../../services/archiveService';

interface ArchivedAnnouncementsProps {
  onRestoreSuccess?: () => void;
}

const ArchivedAnnouncements: React.FC<ArchivedAnnouncementsProps> = ({ onRestoreSuccess }) => {
  const { isAuthenticated } = useAdminAuth();
  const [announcements, setAnnouncements] = useState<ArchivedAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [limit, setLimit] = useState(10);

  // Search handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Filter and paginate announcements using useMemo for performance
  const filteredAndPaginatedData = useMemo(() => {
    // First filter the announcements
    const filtered = searchQuery.trim() === ''
      ? announcements
      : announcements.filter(announcement =>
          announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (announcement.author_name && announcement.author_name.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    // Calculate pagination
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / limit);
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAnnouncements = filtered.slice(startIndex, endIndex);

    return {
      announcements: paginatedAnnouncements,
      totalItems: totalFiltered,
      totalPages,
      currentPage,
      limit
    };
  }, [announcements, searchQuery, currentPage, limit]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAnnouncements();
    } else {
      setError('Authentication required to access archived announcements');
      setLoading(false);
    }
  }, [isAuthenticated]); // Load all data once, like CategoryManagement

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: ArchiveFilters = {};
      // Remove server-side search since we're doing client-side filtering

      const pagination: ArchivePagination = {
        page: 1,
        limit: 100, // Use reasonable limit to avoid backend validation errors
        sort_by: 'archived_at',
        sort_order: 'DESC'
      };

      const response = await archiveService.getArchivedAnnouncements(filters, pagination);

      if (response.success && response.data && response.data.data) {
        setAnnouncements(response.data.data);
      } else {
        setError('Failed to load archived announcements');
      }
    } catch (error: any) {
      console.error('Error loading archived announcements:', error);
      console.error('Error details:', error.response?.data || error);

      // Check if it's an authentication error
      if (error.status === 401 || error.message?.includes('Authorization')) {
        setError('Authentication failed. Please log in again to access archived announcements.');
      } else if (error.status === 403) {
        setError('You do not have permission to access archived announcements.');
      } else {
        setError(error.message || 'Failed to load archived announcements');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (announcementId: number) => {
    if (!window.confirm('Are you sure you want to restore this announcement?')) {
      return;
    }

    try {
      setRestoring(announcementId);
      const response = await archiveService.restoreAnnouncement(announcementId);
      
      if (response.success) {
        alert('Announcement restored successfully!');
        await loadAnnouncements();
        onRestoreSuccess?.();
      } else {
        alert('Failed to restore announcement');
      }
    } catch (error: any) {
      console.error('Error restoring announcement:', error);
      alert(error.message || 'Failed to restore announcement');
    } finally {
      setRestoring(null);
    }
  };

  const handlePermanentDelete = async (announcementId: number) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this announcement? This action cannot be undone!')) {
      return;
    }

    try {
      setDeleting(announcementId);
      const response = await archiveService.permanentlyDeleteAnnouncement(announcementId);
      
      if (response.success) {
        alert('Announcement permanently deleted!');
        await loadAnnouncements();
        onRestoreSuccess?.();
      } else {
        alert('Failed to delete announcement');
      }
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      alert(error.message || 'Failed to delete announcement');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getArchivalInfo = (announcement: ArchivedAnnouncement) => {
    // If archived_at exists, it was auto-archived by the system
    if (announcement.archived_at) {
      return {
        label: 'Archived',
        date: announcement.archived_at,
        isSystemArchived: true
      };
    }
    // Otherwise, it was manually deleted by a user
    return {
      label: 'Archived',
      date: announcement.deleted_at,
      isSystemArchived: false
    };
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
        color: '#6b7280'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          Loading archived announcements...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search
            size={20}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }}
          />
          <input
            type="text"
            placeholder="Search archived announcements..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0.25rem',
                borderRadius: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <div style={{
          color: '#6b7280',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          {announcements.length} archived announcement{announcements.length !== 1 ? 's' : ''}
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {/* Announcements List */}
      {!announcements || announcements.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6b7280'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#f3f4f6',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Search size={24} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: '600' }}>
            No archived announcements found
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            {searchQuery ? 'Try adjusting your search terms' : 'No announcements have been archived yet'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Legend */}
          {/* <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            fontSize: '0.75rem',
            color: '#64748b'
          }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Archive size={12} style={{ color: '#059669' }} />
                <span><strong style={{ color: '#059669' }}>Archived:</strong> System archived due to expiration</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <UserX size={12} style={{ color: '#dc2626' }} />
                <span><strong style={{ color: '#dc2626' }}>Archived:</strong> Manually deleted by user</span>
              </div>
            </div>
          </div> */}

          {filteredAndPaginatedData.announcements && filteredAndPaginatedData.announcements.map((announcement) => (
            <div
              key={announcement.announcement_id}
              style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      {announcement.title}
                    </h3>
                    {Boolean(announcement.is_alert) && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: '#fef3c7',
                        color: '#d97706',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        <AlertTriangle size={12} />
                        Alert
                      </div>
                    )}
                    {Boolean(announcement.is_pinned) && (
                      <div style={{
                        background: '#dbeafe',
                        color: '#1d4ed8',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        Pinned
                      </div>
                    )}
                  </div>
                  
                  <p style={{
                    margin: '0 0 1rem',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}>
                    {truncateContent(announcement.content)}
                  </p>

                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Tag size={12} />
                      <span style={{
                        background: announcement.category_color,
                        color: 'white',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        fontWeight: '500'
                      }}>
                        {announcement.category_name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <User size={12} />
                      {announcement.author_name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {(() => {
                        const archivalInfo = getArchivalInfo(announcement);
                        const IconComponent = archivalInfo.isSystemArchived ? Archive : UserX;
                        return (
                          <>
                            <IconComponent
                              size={12}
                              style={{ color: archivalInfo.isSystemArchived ? '#059669' : '#dc2626' }}
                            />
                            <span style={{
                              color: archivalInfo.isSystemArchived ? '#059669' : '#dc2626', // Green for system archived, red for user archived
                              fontWeight: '500'
                            }}>
                              {archivalInfo.label}: {formatDate(archivalInfo.date)}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginLeft: '1rem'
                }}>
                  <button
                    onClick={() => handleRestore(announcement.announcement_id)}
                    disabled={restoring === announcement.announcement_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: restoring === announcement.announcement_id ? 'not-allowed' : 'pointer',
                      opacity: restoring === announcement.announcement_id ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (restoring !== announcement.announcement_id) {
                        e.currentTarget.style.background = '#059669';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (restoring !== announcement.announcement_id) {
                        e.currentTarget.style.background = '#10b981';
                      }
                    }}
                  >
                    <RotateCcw size={14} />
                    {restoring === announcement.announcement_id ? 'Restoring...' : 'Restore'}
                  </button>

                  {/* ill comment this buutton delete because I dont use this for now */}
                  {/* <button
                    onClick={() => handlePermanentDelete(announcement.announcement_id)}
                    disabled={deleting === announcement.announcement_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: deleting === announcement.announcement_id ? 'not-allowed' : 'pointer',
                      opacity: deleting === announcement.announcement_id ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (deleting !== announcement.announcement_id) {
                        e.currentTarget.style.background = '#b91c1c';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (deleting !== announcement.announcement_id) {
                        e.currentTarget.style.background = '#dc2626';
                      }
                    }}
                  >
                    <Trash2 size={14} />
                    {deleting === announcement.announcement_id ? 'Deleting...' : 'Delete'}
                  </button> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rows per page control */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '24px',
        padding: '16px 0',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          <span>Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div style={{
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Showing {filteredAndPaginatedData.announcements.length} of {filteredAndPaginatedData.totalItems} archived announcements
        </div>
      </div>

      {/* Pagination */}
      {filteredAndPaginatedData.totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === 1 ? '#f3f4f6' : '#3b82f6',
              color: currentPage === 1 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          
          <span style={{
            padding: '0.5rem 1rem',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            Page {currentPage} of {filteredAndPaginatedData.totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === filteredAndPaginatedData.totalPages}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === filteredAndPaginatedData.totalPages ? '#f3f4f6' : '#3b82f6',
              color: currentPage === filteredAndPaginatedData.totalPages ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: currentPage === filteredAndPaginatedData.totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ArchivedAnnouncements;
