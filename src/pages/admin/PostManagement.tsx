import React, { useState, useEffect, useMemo } from 'react';
import { useAnnouncements, useCategories } from '../../hooks/useAnnouncements';
import { useToast } from '../../contexts/ToastContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { usePermissions } from '../../utils/permissions';
import { adminAnnouncementService } from '../../services/announcementService';
import AnnouncementModal from '../../components/admin/modals/AnnouncementModal';
import AnnouncementViewDialog from '../../components/admin/modals/AnnouncementViewDialog';
import FacebookImageGallery from '../../components/common/FacebookImageGallery';

import type {
  Announcement,
  CreateAnnouncementData,
  UpdateAnnouncementData,
  AnnouncementFilters
} from '../../types/announcement.types';
import {
  CheckCircle,
  Clock,
  Calendar,
  X,
  MessageSquare,
  Search,
  RefreshCw,
  Pin,
  AlertTriangle,
  User,
  Eye,
  Heart,
  MessageCircle,
  Edit,
  Send,
  Trash2
} from 'lucide-react';

const PostManagement: React.FC = () => {
  const { user } = useAdminAuth();
  const permissions = usePermissions(user);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Toast notifications
  const { showSuccess, showError } = useToast();

  // View dialog state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);

  // Initialize filters with grade level filtering for grade-specific admins
  const [filters, setFilters] = useState<AnnouncementFilters>(() => {
    const baseFilters: AnnouncementFilters = {
      page: 1,
      limit: 10,
      sort_by: 'created_at',
      sort_order: 'DESC'
    };

    // Add grade level filter for grade-specific admins
    if (user?.grade_level) {
      baseFilters.grade_level = user.grade_level;
      console.log('🎯 PostManagement - Initial grade level filter set:', {
        userGradeLevel: user.grade_level,
        userEmail: user.email,
        userRole: user.role
      });
    } else {
      console.log('🌐 PostManagement - No grade level filter (system admin):', {
        userGradeLevel: user?.grade_level,
        userEmail: user?.email,
        userRole: user?.role
      });
    }

    return baseFilters;
  });

  const {
    announcements,
    loading,
    error,
    pagination,
    refresh,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    publishAnnouncement,
    unpublishAnnouncement,
    setFilters: updateFilters
  } = useAnnouncements(filters, true); // Use admin service

  const { categories } = useCategories();

  // Handle category selection
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId || undefined);
  };

  // Search handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Reset pagination when searching
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategoryId(undefined);
    setSelectedStatus('');
  };

  // Get current filter summary
  const getFilterSummary = () => {
    const filters = [];

    if (searchQuery) {
      filters.push(`Search: "${searchQuery}"`);
    }

    if (selectedCategoryId) {
      const category = categories.find(cat => cat.category_id === selectedCategoryId);
      if (category) {
        filters.push(`Category: ${category.name}`);
      }
    }

    if (selectedStatus) {
      filters.push(`Status: ${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}`);
    }

    return filters;
  };

  // Update filters when search query or other filter values change
  // Load all announcements once and filter client-side (like CategoryManagement)
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load all announcements once
  useEffect(() => {
    const loadAllAnnouncements = async () => {
      try {
        setInitialLoading(true);
        const allFilters: AnnouncementFilters = {
          page: 1,
          limit: 100, // Use reasonable limit to avoid backend validation errors
          sort_by: 'created_at',
          sort_order: 'DESC'
        };

        // Ensure grade level filter is preserved for grade-specific admins
        if (user?.grade_level) {
          allFilters.grade_level = user.grade_level;
        }

        console.log('🔍 PostManagement - Loading all announcements once:', {
          userGradeLevel: user?.grade_level,
          appliedGradeLevel: allFilters.grade_level,
          allFilters
        });

        updateFilters(allFilters);
      } catch (error) {
        console.error('Error loading all announcements:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    if (user) {
      loadAllAnnouncements();
    }
  }, [user?.grade_level, user?.position]); // Only reload when user context changes

  // Store all announcements when they're loaded
  useEffect(() => {
    if (announcements.length > 0 && !loading) {
      setAllAnnouncements(announcements);
    }
  }, [announcements, loading]);

  // Client-side filtering using useMemo (like CategoryManagement)
  const filteredAndPaginatedData = useMemo(() => {
    // Filter announcements based on search query, category, and status
    const filteredAnnouncements = allAnnouncements.filter(announcement => {
      const matchesSearch = searchQuery.trim() === '' ||
        announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !selectedCategoryId || announcement.category_id === selectedCategoryId;
      const matchesStatus = !selectedStatus || announcement.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Calculate pagination
    const totalFiltered = filteredAnnouncements.length;
    const totalPages = Math.ceil(totalFiltered / (filters.limit || 20));
    const startIndex = ((filters.page || 1) - 1) * (filters.limit || 20);
    const endIndex = startIndex + (filters.limit || 20);
    const paginatedAnnouncements = filteredAnnouncements.slice(startIndex, endIndex);

    return {
      announcements: paginatedAnnouncements,
      totalItems: totalFiltered,
      totalPages,
      currentPage: filters.page || 1,
      itemsPerPage: filters.limit || 20
    };
  }, [allAnnouncements, searchQuery, selectedCategoryId, selectedStatus, filters.page, filters.limit]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const handleCreateAnnouncement = () => {
    console.log('🆕 Creating new announcement - clearing all data');

    // Ensure editing announcement is completely cleared
    setEditingAnnouncement(null);

    // Clear any existing success/error messages
    setSuccessMessage('');
    setErrorMessage('');

    // Small delay to ensure state is cleared before opening modal
    setTimeout(() => {
      setShowModal(true);
      console.log('✅ Modal opened for new announcement creation');
    }, 10);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    console.log('✏️ Editing announcement:', {
      id: announcement.announcement_id,
      title: announcement.title,
      is_pinned: announcement.is_pinned,
      is_alert: announcement.is_alert,
      allow_comments: announcement.allow_comments,
      allow_sharing: announcement.allow_sharing
    });
    setEditingAnnouncement(announcement);
    setShowModal(true);
  };

  const handleDeleteAnnouncement = async (announcementId: number) => {
    const announcement = announcements.find(a => a.announcement_id === announcementId);
    const confirmMessage = `Are you sure you want to delete "${announcement?.title}"? This action can be undone from the admin panel.`;

    if (window.confirm(confirmMessage)) {
      try {
        await deleteAnnouncement(announcementId);
        showSuccess(
          'Announcement Deleted',
          `"${announcement?.title}" has been moved to trash successfully.`,
          3000
        );
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to delete announcement';
        setErrorMessage(errorMsg);
        showError('Delete Failed', errorMsg, 4000);
      }
    }
  };

  const handlePublishAnnouncement = async (announcementId: number) => {
    try {
      await publishAnnouncement(announcementId);
      const announcement = announcements.find(a => a.announcement_id === announcementId);
      showSuccess(
        'Announcement Published',
        `"${announcement?.title}" is now live and visible to all users.`,
        3000
      );
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to publish announcement';
      setErrorMessage(errorMsg);
      showError('Publish Failed', errorMsg, 4000);
    }
  };

  const handleUnpublishAnnouncement = async (announcementId: number) => {
    try {
      await unpublishAnnouncement(announcementId);
      const announcement = announcements.find(a => a.announcement_id === announcementId);
      showSuccess(
        'Announcement Unpublished',
        `"${announcement?.title}" has been moved back to draft status.`,
        3000
      );
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to unpublish announcement';
      setErrorMessage(errorMsg);
      showError('Unpublish Failed', errorMsg, 4000);
    }
  };

  const handleViewAnnouncement = (announcementId: number) => {
    const announcement = announcements.find(a => a.announcement_id === announcementId);
    if (announcement) {
      setViewingAnnouncement(announcement);
      setIsViewDialogOpen(true);
    }
  };

  const handleCloseViewDialog = () => {
    setIsViewDialogOpen(false);
    setViewingAnnouncement(null);
  };

  const handleSaveAnnouncement = async (data: CreateAnnouncementData | UpdateAnnouncementData | FormData, applyPendingDeletes?: () => Promise<void>, onComplete?: () => Promise<void>) => {
    try {
      const isEditing = !!editingAnnouncement;

      if (isEditing) {
        await updateAnnouncement(editingAnnouncement.announcement_id, data as UpdateAnnouncementData | FormData);

        // Apply pending image deletions AFTER successful update
        if (applyPendingDeletes) {
          console.log('🗑️ Applying pending image deletions after successful update');
          await applyPendingDeletes();
        }
      } else {
        // For new announcements, automatically set grade level for grade-specific admins
        let announcementData = data as CreateAnnouncementData | FormData;

        if (user?.grade_level && !(data instanceof FormData)) {
          // If admin has a specific grade level and data is not FormData, set grade_level
          announcementData = {
            ...data as CreateAnnouncementData,
            grade_level: user.grade_level
          };
        } else if (user?.grade_level && data instanceof FormData) {
          // If data is FormData, append grade_level
          data.append('grade_level', user.grade_level.toString());
        }

        await createAnnouncement(announcementData);
      }

      // Execute completion callback (image uploads, etc.) BEFORE refreshing
      if (onComplete) {
        await onComplete();
      }

      // Explicitly refresh the list to ensure new/updated announcements appear immediately
      console.log('🔄 Refreshing announcements list after save...');
      await refresh();
      console.log('✅ Announcements list refreshed');

      // Clear any existing error messages
      setErrorMessage('');

      // Close modal first
      setShowModal(false);
      setEditingAnnouncement(null);

      // Then show success message after a brief delay to ensure modal is closed
      setTimeout(() => {
        if (isEditing) {
          alert('✅ Announcement updated successfully! Changes are now visible.');
        } else {
          alert('✅ Announcement created successfully!');
        }
      }, 100);

    } catch (error: any) {
      const errorMsg = error.message || 'Failed to save announcement';
      setErrorMessage(errorMsg);
      showError(
        'Save Failed',
        errorMsg,
        5000
      );
      throw error; // Re-throw to let modal handle it
    } finally {
      // Always clean up modal state
      setShowModal(false);
      setEditingAnnouncement(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAnnouncement(null);
  };

  const handleSubmitForApproval = async (announcementId: number) => {
    const announcement = announcements.find(a => a.announcement_id === announcementId);
    const confirmMessage = `Submit "${announcement?.title}" for approval?\n\nOnce submitted, you won't be able to edit it until it's approved or rejected.`;

    if (window.confirm(confirmMessage)) {
      try {
        await adminAnnouncementService.submitForApproval(announcementId);
        showSuccess(
          'Submitted for Approval',
          `"${announcement?.title}" has been submitted for approval.`,
          3000
        );
        // Refresh the list to update the status
        refresh();
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to submit announcement for approval';
        setErrorMessage(errorMsg);
        showError('Submission Failed', errorMsg, 5000);
      }
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

  // Get category color
  const getCategoryColor = (announcement: Announcement) => {
    // Find the category color from the categories list
    if (announcement.category_id && categories && categories.length > 0) {
      const category = categories.find(cat => cat.category_id === announcement.category_id);
      if (category && category.color_code) {
        return category.color_code;
      }
    }
    // Fallback to announcement's category_color if available
    if (announcement.category_color) {
      return announcement.category_color;
    }
    // Default fallback color
    return '#22c55e';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      draft: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Calendar },
      archived: { color: 'bg-gray-100 text-gray-800', icon: X }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent size={12} className="mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handlePageChange = (page: number) => {
    // Update filters without triggering API call (client-side pagination)
    setFilters(prev => ({ ...prev, page }));
  };

  const handleItemsPerPageChange = (limit: number) => {
    // Update filters without triggering API call (client-side pagination)
    setFilters(prev => ({ ...prev, limit, page: 1 })); // Reset to first page when changing items per page
  };

  // Enhanced pagination component - Always visible
  const EnhancedPagination = () => {
    // Always show pagination if we have pagination data, even for single page
    if (!pagination) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      const currentPage = filteredAndPaginatedData.currentPage;
      const totalPages = Math.max(filteredAndPaginatedData.totalPages, 1); // Ensure at least 1 page

      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }

      return pages;
    };

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '2rem',
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>

        {/* Items per page selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Show:</span>
          <select
            value={filters.limit}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            style={{
              padding: '0.25rem 0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.875rem',
              backgroundColor: 'white'
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>per page</span>
        </div>

        {/* Page info */}
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Showing {((filteredAndPaginatedData.currentPage - 1) * filteredAndPaginatedData.itemsPerPage) + 1}-{Math.min(filteredAndPaginatedData.currentPage * filteredAndPaginatedData.itemsPerPage, filteredAndPaginatedData.totalItems)} of {filteredAndPaginatedData.totalItems} posts
          {searchQuery && ` (filtered by "${searchQuery}")`}
        </div>

        {/* Page navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handlePageChange(1)}
            disabled={filteredAndPaginatedData.currentPage === 1}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: filteredAndPaginatedData.currentPage === 1 ? '#f3f4f6' : 'white',
              color: filteredAndPaginatedData.currentPage === 1 ? '#9ca3af' : '#374151',
              cursor: filteredAndPaginatedData.currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            First
          </button>

          <button
            onClick={() => handlePageChange(filteredAndPaginatedData.currentPage - 1)}
            disabled={filteredAndPaginatedData.currentPage === 1}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: filteredAndPaginatedData.currentPage === 1 ? '#f3f4f6' : 'white',
              color: filteredAndPaginatedData.currentPage === 1 ? '#9ca3af' : '#374151',
              cursor: filteredAndPaginatedData.currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Previous
          </button>

          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && handlePageChange(page)}
              disabled={page === '...'}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: page === filteredAndPaginatedData.currentPage ? '#3b82f6' : page === '...' ? 'transparent' : 'white',
                color: page === filteredAndPaginatedData.currentPage ? 'white' : page === '...' ? '#9ca3af' : '#374151',
                cursor: page === '...' ? 'default' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: page === filteredAndPaginatedData.currentPage ? '600' : '400'
              }}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(filteredAndPaginatedData.currentPage + 1)}
            disabled={filteredAndPaginatedData.currentPage === filteredAndPaginatedData.totalPages}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: filteredAndPaginatedData.currentPage === filteredAndPaginatedData.totalPages ? '#f3f4f6' : 'white',
              color: filteredAndPaginatedData.currentPage === filteredAndPaginatedData.totalPages ? '#9ca3af' : '#374151',
              cursor: filteredAndPaginatedData.currentPage === filteredAndPaginatedData.totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Next
          </button>

          <button
            onClick={() => handlePageChange(filteredAndPaginatedData.totalPages)}
            disabled={filteredAndPaginatedData.currentPage === filteredAndPaginatedData.totalPages}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: filteredAndPaginatedData.currentPage === filteredAndPaginatedData.totalPages ? '#f3f4f6' : 'white',
              color: filteredAndPaginatedData.currentPage === filteredAndPaginatedData.totalPages ? '#9ca3af' : '#374151',
              cursor: filteredAndPaginatedData.currentPage === filteredAndPaginatedData.totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  if (loading && (!announcements || announcements.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <p style={{
            color: '#6b7280',
            margin: 0,
            fontSize: '1.1rem'
          }}>
            {user?.grade_level && (
              <span style={{
                display: 'inline-block',
                marginLeft: '0.5rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Grade {user.grade_level} Only
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
          borderRadius: '8px'
        }}>
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          borderRadius: '8px'
        }}>
          {errorMessage}
        </div>
      )}

      {/* Filters */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e8f5e8'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr 120px 120px 120px',
          gap: '1rem'
        }}>
          {user && user.position !== 'super_admin' && (
            <div style={{ display: 'flex', alignItems: 'end', gap: '0.5rem' }}>
              <button
                onClick={handleCreateAnnouncement}
                style={{
                  width: '120px',
                  padding: '0.75rem',
                  background: '#1268f3ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                + Create
              </button>
            </div>
          )}
          <div style={{ gridColumn: 'span 1' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Search
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                color="#9ca3af"
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="text"
                placeholder="Search announcements..."
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
          </div>
          <div style={{ width: '120px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Category Filter
            </label>
            <select
              value={selectedCategoryId || ''}
              onChange={(e) => handleCategoryChange(e.target.value ? parseInt(e.target.value) : null)}
              style={{
                width: '120px',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: 'white',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#22c55e';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="">All Categories</option>
              {categories && categories.length > 0 ? categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.name}
                </option>
              )) : (
                <option disabled>Loading categories...</option>
              )}
            </select>
          </div>
          <div style={{ width: '120px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: '120px',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: 'white',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#22c55e';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'end', gap: '0.5rem' }}>
            <button
              onClick={clearFilters}
              style={{
                width: '120px',
                padding: '0.75rem',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fde68a'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                Reset Filter
              </span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Active Filters Summary */}
      {getFilterSummary().length > 0 && (
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <Search size={16} style={{ color: '#0369a1' }} />
            <span style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#0369a1'
            }}>
              Active Filters:
            </span>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            {getFilterSummary().map((filter, index) => (
              <span
                key={index}
                style={{
                  background: '#dbeafe',
                  color: '#1e40af',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}
              >
                {filter}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e8f5e8'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 0'
          }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              border: '2px solid #e5e7eb',
              borderTop: '2px solid #22c55e',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        ) : announcements.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem'
          }}>
            <div style={{
              fontSize: '3rem',
              color: '#9ca3af',
              marginBottom: '1rem'
            }}>
              <MessageSquare size={20} color="#1e40af" />
            </div>
            <h3 style={{
              margin: '0.5rem 0',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#111827'
            }}>
              No announcements
            </h3>
            <p style={{
              margin: '0.25rem 0 1.5rem 0',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              Get started by creating a new announcement.
            </p>
            <button
              onClick={handleCreateAnnouncement}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #22c55e 0%, #facc15 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              + Create Announcement
            </button>
          </div>
        ) : (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredAndPaginatedData.announcements && filteredAndPaginatedData.announcements.length > 0 ? filteredAndPaginatedData.announcements.map((announcement: Announcement) => (
              <div
                key={announcement.announcement_id}
                style={{
                  padding: '1.5rem',
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.5rem'
                    }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#111827',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {announcement.title}
                      </h3>
                      {announcement.category_name && (
                        <span style={{
                          background: getCategoryColor(announcement),
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {announcement.category_name}
                        </span>
                      )}
                      {Boolean(announcement.is_pinned) && (
                        <Pin size={16} color="#eab308" />
                      )}
                      {Boolean(announcement.is_alert) && (
                        <AlertTriangle size={16} color="#ef4444" />
                      )}
                      {getStatusBadge(announcement.status)}
                    </div>

                    <p style={{
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      marginBottom: '0.75rem',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {announcement.content}
                    </p>

                    {/* Display images if available */}
                    {((announcement.attachments && announcement.attachments.length > 0) ||
                      (announcement.images && announcement.images.length > 0) ||
                      announcement.image_url || announcement.image_path) && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <FacebookImageGallery
                          images={
                            // Use attachments/images array if available, otherwise fallback to single image
                            (announcement.attachments && announcement.attachments.length > 0)
                              ? announcement.attachments.map(att => att.file_path)
                              : (announcement.images && announcement.images.length > 0)
                                ? announcement.images.map(img => img.file_path)
                                : [announcement.image_url || announcement.image_path].filter(Boolean) as string[]
                          }
                          altPrefix={announcement.title}
                          maxVisible={3}
                        />
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <User size={14} style={{ marginRight: '0.25rem' }} />
                        {announcement.author_name || 'Unknown'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <Calendar size={14} style={{ marginRight: '0.25rem' }} />
                        {formatDate(announcement.created_at)}
                      </span>
                      {/* I will comment 'Views' for the mean time and I will uncomment this in the future */}
                      {/* <span style={{ display: 'flex', alignItems: 'center' }}>
                        <Eye size={14} style={{ marginRight: '0.25rem' }} />
                        {announcement.view_count || 0} views
                      </span> */}
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <Heart size={14} style={{ marginRight: '0.25rem' }} />
                        {announcement.reaction_count || 0} reactions
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <MessageCircle size={14} style={{ marginRight: '0.25rem' }} />
                        {announcement.comment_count || 0} comments
                      </span>
                    </div>

                    {/* Visibility Schedule Info */}
                    {(announcement.visibility_start_at || announcement.visibility_end_at) && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem',
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        color: '#0369a1'
                      }}>
                        <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>📅 Visibility Schedule:</div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          {announcement.visibility_start_at && (
                            <span>From: {formatDate(announcement.visibility_start_at)}</span>
                          )}
                          {announcement.visibility_end_at && (
                            <span>Until: {formatDate(announcement.visibility_end_at)}</span>
                          )}
                          {!announcement.visibility_start_at && !announcement.visibility_end_at && (
                            <span>Always visible</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginLeft: '1rem'
                  }}>
                    <button
                      onClick={() => handleViewAnnouncement(announcement.announcement_id)}
                      style={{
                        padding: '0.5rem',
                        color: '#ffffff',
                        background: '#6b7280',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease'
                      }}
                      title="View"
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#4b5563';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#6b7280';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleEditAnnouncement(announcement)}
                      style={{
                        padding: '0.5rem',
                        color: '#ffffff',
                        background: '#3b82f6',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease'
                      }}
                      title="Edit"
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#2563eb';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#3b82f6';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <Edit size={16} />
                    </button>

                    {/* I will comment these because I dont want to use these */}
                    {/* {announcement.status === 'draft' && permissions.isProfessor && (
                      <button
                        onClick={() => handleSubmitForApproval(announcement.announcement_id)}
                        style={{
                          padding: '0.5rem',
                          color: '#ffffff',
                          background: '#f59e0b',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        title="Submit for Approval"
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#d97706';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = '#f59e0b';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <Send size={16} />
                      </button>
                    )}
                    {announcement.status === 'draft' && permissions.isSuperAdmin && (
                      <button
                        onClick={() => handlePublishAnnouncement(announcement.announcement_id)}
                        style={{
                          padding: '0.5rem',
                          color: '#ffffff',
                          background: '#22c55e',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        title="Publish"
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#16a34a';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = '#22c55e';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <Send size={16} />
                      </button>
                    )}
                    {announcement.status === 'published' && (
                      <button
                        onClick={() => handleUnpublishAnnouncement(announcement.announcement_id)}
                        style={{
                          padding: '0.5rem',
                          color: '#ffffff',
                          background: '#eab308',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        title="Unpublish"
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#ca8a04';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = '#eab308';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <Clock size={16} />
                      </button>
                    )} */}
                    <button
                      onClick={() => handleDeleteAnnouncement(announcement.announcement_id)}
                      style={{
                        padding: '0.5rem',
                        color: '#ffffff',
                        background: '#ef4444',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease'
                      }}
                      title="Delete"
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#dc2626';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#ef4444';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                {loading ? 'Loading announcements...' : 'No announcements found.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Pagination */}
      <EnhancedPagination />

      {/* Announcement Modal */}
      <AnnouncementModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveAnnouncement}
        announcement={editingAnnouncement}
        loading={loading}
      />

      {/* View Dialog */}
      <AnnouncementViewDialog
        isOpen={isViewDialogOpen}
        onClose={handleCloseViewDialog}
        announcement={viewingAnnouncement}
      />
    </div>
  );
};

export default PostManagement;
