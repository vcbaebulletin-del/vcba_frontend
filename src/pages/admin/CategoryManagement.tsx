import React, { useState, useEffect, useMemo } from 'react';
import { FolderTree, Plus, AlertTriangle, CheckCircle, Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { usePermissions } from '../../utils/permissions';
import { categoryService, CategoryDeletionError } from '../../services/categoryService';
import CategoryList from '../../components/admin/CategoryList';
import CategoryModal from '../../components/admin/CategoryModal';

interface Category {
  category_id?: number;
  name: string;
  description?: string;
  color_code: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  subcategories?: Subcategory[];
}

interface Subcategory {
  subcategory_id?: number;
  category_id?: number;
  name: string;
  description?: string;
  color_code: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

const CategoryManagement: React.FC = () => {
  const adminAuth = useAdminAuth();
  const permissions = usePermissions(adminAuth.user);

  // State management
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add_category' | 'edit_category' | 'add_subcategory' | 'edit_subcategory'>('add_category');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    // Check authentication first
    if (!adminAuth.isAuthenticated) {
      setError('Please log in as an admin to manage categories');
      setLoading(false);
      return;
    }

    // Check if user has permission to manage categories
    if (!permissions.canManageCategories) {
      setError('You do not have permission to manage categories');
      setLoading(false);
      return;
    }

    // Debug authentication status
    console.log('🔍 CategoryManagement - Authentication status:', {
      isAuthenticated: adminAuth.isAuthenticated,
      user: adminAuth.user,
      canManageCategories: permissions.canManageCategories,
      tokenInStorage: !!localStorage.getItem('vcba_admin_auth_token')
    });

    loadCategories();
  }, [adminAuth.isAuthenticated, permissions.canManageCategories]);

  // Filter and paginate categories
  const filteredAndPaginatedData = useMemo(() => {
    // Filter categories based on search query
    const filteredCategories = searchQuery.trim() === ''
      ? categories
      : categories.filter(category => {
          const query = searchQuery.toLowerCase();

          // Check if category name or description matches
          const categoryNameMatch = category.name.toLowerCase().includes(query);
          const categoryDescMatch = category.description?.toLowerCase().includes(query) || false;

          // Check if any subcategory name or description matches
          const subcategoryMatch = category.subcategories?.some(sub =>
            sub.name.toLowerCase().includes(query) ||
            sub.description?.toLowerCase().includes(query)
          ) || false;

          return categoryNameMatch || categoryDescMatch || subcategoryMatch;
        });

    // Calculate pagination based on categories (not individual items)
    const totalCategories = filteredCategories.length;
    const totalPages = Math.ceil(totalCategories / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

    return {
      categories: paginatedCategories,
      totalItems: totalCategories,
      totalPages,
      currentPage,
      itemsPerPage
    };
  }, [categories, searchQuery, currentPage, itemsPerPage]);

  // Search and pagination handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFirstPage = () => setCurrentPage(1);
  const handleLastPage = () => setCurrentPage(filteredAndPaginatedData.totalPages);
  const handlePreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(filteredAndPaginatedData.totalPages, prev + 1));

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 CategoryManagement - Loading categories from API...');
      const response = await categoryService.getCategoriesWithSubcategories();
      console.log('🔍 CategoryManagement - API response:', response);

      if (response.success && response.data?.categories) {
        setCategories(response.data.categories);
        console.log('✅ CategoryManagement - Categories loaded successfully:', response.data.categories.length);
      } else {
        throw new Error(response.message || 'Failed to load categories');
      }

    } catch (err: any) {
      console.error('❌ CategoryManagement - Error loading categories:', err);

      // Check for authentication issues first
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('❌ Authentication failed. Please log in as an admin with category management permissions.');
        setCategories([]);
        return;
      }

      // Check if it's a 404 or network error (API not available)
      const isApiUnavailable = err.response?.status === 404 ||
                              err.code === 'ECONNREFUSED' ||
                              err.message.includes('Network Error') ||
                              err.message.includes('Failed to fetch');

      if (isApiUnavailable) {
        console.log('⚠️ CategoryManagement - API not available, using mock data');

        // Use mock data as fallback
        const mockCategories: Category[] = [
          // {
          //   category_id: 1,
          //   name: 'Academic',
          //   description: 'Academic-related announcements and events',
          //   color_code: '#3b82f6',
          //   is_active: true,
          //   created_at: '2025-01-01T00:00:00Z',
          //   updated_at: '2025-01-01T00:00:00Z',
          //   subcategories: [
          //     {
          //       subcategory_id: 1,
          //       category_id: 1,
          //       name: 'Exams',
          //       description: 'Examination schedules and updates',
          //       color_code: '#ef4444',
          //       display_order: 1,
          //       is_active: true,
          //       created_at: '2025-01-01T00:00:00Z',
          //       updated_at: '2025-01-01T00:00:00Z'
          //     },
          //     {
          //       subcategory_id: 2,
          //       category_id: 1,
          //       name: 'Assignments',
          //       description: 'Assignment deadlines and submissions',
          //       color_code: '#f59e0b',
          //       display_order: 2,
          //       is_active: true,
          //       created_at: '2025-01-01T00:00:00Z',
          //       updated_at: '2025-01-01T00:00:00Z'
          //     },
          //     {
          //       subcategory_id: 3,
          //       category_id: 1,
          //       name: 'Class Schedules',
          //       description: 'Class timing and schedule changes',
          //       color_code: '#06b6d4',
          //       display_order: 3,
          //       is_active: true,
          //       created_at: '2025-01-01T00:00:00Z',
          //       updated_at: '2025-01-01T00:00:00Z'
          //     }
          //   ]
          // },
          // {
          //   category_id: 2,
          //   name: 'Events',
          //   description: 'School events and activities',
          //   color_code: '#10b981',
          //   is_active: true,
          //   created_at: '2025-01-01T00:00:00Z',
          //   updated_at: '2025-01-01T00:00:00Z',
          //   subcategories: [
          //     {
          //       subcategory_id: 4,
          //       category_id: 2,
          //       name: 'Sports',
          //       description: 'Sports events and competitions',
          //       color_code: '#8b5cf6',
          //       display_order: 1,
          //       is_active: true,
          //       created_at: '2025-01-01T00:00:00Z',
          //       updated_at: '2025-01-01T00:00:00Z'
          //     },
          //     {
          //       subcategory_id: 5,
          //       category_id: 2,
          //       name: 'Cultural',
          //       description: 'Cultural events and celebrations',
          //       color_code: '#ec4899',
          //       display_order: 2,
          //       is_active: true,
          //       created_at: '2025-01-01T00:00:00Z',
          //       updated_at: '2025-01-01T00:00:00Z'
          //     }
          //   ]
          // },
          // {
          //   category_id: 3,
          //   name: 'Administrative',
          //   description: 'Administrative notices and updates',
          //   color_code: '#f97316',
          //   is_active: true,
          //   created_at: '2025-01-01T00:00:00Z',
          //   updated_at: '2025-01-01T00:00:00Z',
          //   subcategories: [
          //     {
          //       subcategory_id: 6,
          //       category_id: 3,
          //       name: 'Policies',
          //       description: 'School policies and regulations',
          //       color_code: '#6366f1',
          //       display_order: 1,
          //       is_active: true,
          //       created_at: '2025-01-01T00:00:00Z',
          //       updated_at: '2025-01-01T00:00:00Z'
          //     }
          //   ]
          // },
          // {
          //   category_id: 4,
          //   name: 'Emergency',
          //   description: 'Emergency announcements and alerts',
          //   color_code: '#dc2626',
          //   is_active: true,
          //   created_at: '2025-01-01T00:00:00Z',
          //   updated_at: '2025-01-01T00:00:00Z',
          //   subcategories: []
          // }
        ];

        setCategories(mockCategories);
        setError('⚠️ Using demo data - Backend API not connected. Categories will work in demo mode.');
      } else {
        setError(err.message || 'Failed to load categories');
        setCategories([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler functions
  const handleAddCategory = () => {
    setModalMode('add_category');
    setEditingCategory(null);
    setEditingSubcategory(null);
    setParentCategory(null);
    setShowModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setModalMode('edit_category');
    setEditingCategory(category);
    setEditingSubcategory(null);
    setParentCategory(null);
    setShowModal(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    try {
      setError(null);
      setSuccess(null);

      if (!category.category_id) {
        throw new Error('Category ID is required');
      }

      // First, try normal deletion
      console.log('🔍 CategoryManagement - Attempting to soft delete category:', category.category_id);

      try {
        const response = await categoryService.deleteCategory(category.category_id);

        if (response.success) {
          setSuccess(`Category "${category.name}" has been soft deleted successfully. You can restore it from the Archive section.`);
          loadCategories();
          return;
        }
      } catch (deletionError: any) {
        // Check if it's a subcategory constraint error
        if (deletionError.name === 'CategoryDeletionError' && deletionError.details) {
          const details = deletionError.details;

          // Show detailed error with options
          const subcategoryList = details.activeSubcategories?.map((sub: any) => `• ${sub.name}`).join('\n') || '';
          const confirmMessage = `❌ Cannot delete category "${details.categoryName}"

🔍 REASON: This category has ${details.totalActiveSubcategories} active subcategories:
${subcategoryList}

📋 OPTIONS:
1️⃣ Cancel and manually delete subcategories first
2️⃣ Delete category AND all its subcategories (CASCADE DELETE)

⚠️ CASCADE DELETE will permanently soft-delete:
   • The category "${details.categoryName}"
   • All ${details.totalActiveSubcategories} active subcategories

Choose an option:
• Click "OK" for CASCADE DELETE (delete category + subcategories)
• Click "Cancel" to abort and handle subcategories manually`;

          if (window.confirm(confirmMessage)) {
            // User chose cascade deletion
            console.log('🔄 CategoryManagement - Attempting cascade deletion for category:', category.category_id);

            const cascadeResponse = await categoryService.deleteCategory(category.category_id, {
              cascadeSubcategories: true
            });

            if (cascadeResponse.success) {
              const deletedCount = cascadeResponse.data?.deletedSubcategories || 0;
              setSuccess(
                `✅ Category "${category.name}" and ${deletedCount} subcategories have been soft deleted successfully. ` +
                `You can restore them from the Archive section.`
              );
              loadCategories();
              return;
            }
          } else {
            // User cancelled - show helpful message
            setError(
              `❌ Deletion cancelled. To delete "${category.name}", you must first:\n\n` +
              `1️⃣ Delete these ${details.totalActiveSubcategories} subcategories individually:\n${subcategoryList}\n\n` +
              `2️⃣ OR move them to another category\n\n` +
              `3️⃣ OR use the cascade delete option (delete category + subcategories together)`
            );
            return;
          }
        }

        // Handle API unavailability
        const isApiUnavailable = deletionError.response?.status === 404 ||
                                deletionError.code === 'ECONNREFUSED' ||
                                deletionError.message.includes('Network Error') ||
                                deletionError.message.includes('Failed to fetch');

        if (isApiUnavailable) {
          setError('⚠️ Backend API not available. Please ensure the server is running on port 5000.');
          return;
        }

        // Re-throw other errors
        throw deletionError;
      }
    } catch (error: any) {
      console.error('❌ CategoryManagement - Error deleting category:', error);
      setError(error.message || 'Failed to delete category');
    }
  };

  const handleToggleCategoryStatus = async (category: Category) => {
    try {
      setError(null);
      setSuccess(null);

      if (!category.category_id) {
        throw new Error('Category ID is required');
      }

      console.log('🔍 CategoryManagement - Toggling category status:', category.category_id, !category.is_active);
      const response = await categoryService.toggleCategoryStatus(category.category_id, !category.is_active);

      if (response.success) {
        const action = category.is_active ? 'deactivated' : 'activated';
        setSuccess(`Category "${category.name}" has been ${action} successfully`);
        loadCategories();
      } else {
        throw new Error(response.message || 'Failed to update category status');
      }

    } catch (err: any) {
      console.error('❌ CategoryManagement - Error toggling category status:', err);

      // Check if API is unavailable
      const isApiUnavailable = err.response?.status === 404 ||
                              err.code === 'ECONNREFUSED' ||
                              err.message.includes('Network Error') ||
                              err.message.includes('Failed to fetch');

      if (isApiUnavailable) {
        setError('⚠️ Backend API not available. Please ensure the server is running on port 5000.');
      } else {
        setError(err.message || 'Failed to update category status');
      }
    }
  };

  const handleAddSubcategory = (category: Category) => {
    setModalMode('add_subcategory');
    setEditingCategory(null);
    setEditingSubcategory(null);
    setParentCategory(category);
    setShowModal(true);
  };

  const handleEditSubcategory = (category: Category, subcategory: Subcategory) => {
    setModalMode('edit_subcategory');
    setEditingCategory(null);
    setEditingSubcategory(subcategory);
    setParentCategory(category);
    setShowModal(true);
  };

  const handleDeleteSubcategory = async (category: Category, subcategory: Subcategory) => {
    if (!window.confirm(`Are you sure you want to delete the subcategory "${subcategory.name}"? This action will soft delete the subcategory and it can be restored later.`)) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      if (!category.category_id || !subcategory.subcategory_id) {
        throw new Error('Category ID and Subcategory ID are required');
      }

      console.log('🔍 CategoryManagement - Soft deleting subcategory:', subcategory.subcategory_id);
      const response = await categoryService.deleteSubcategory(subcategory.subcategory_id!);

      if (response.success) {
        setSuccess(`Subcategory "${subcategory.name}" has been soft deleted successfully. You can restore it from the Archive section.`);
        loadCategories();
      } else {
        throw new Error(response.message || 'Failed to delete subcategory');
      }

    } catch (err: any) {
      console.error('❌ CategoryManagement - Error deleting subcategory:', err);

      // Check if API is unavailable
      const isApiUnavailable = err.response?.status === 404 ||
                              err.code === 'ECONNREFUSED' ||
                              err.message.includes('Network Error') ||
                              err.message.includes('Failed to fetch');

      if (isApiUnavailable) {
        setError('⚠️ Backend API not available. Please ensure the server is running on port 5000.');
      } else {
        setError(err.message || 'Failed to delete subcategory');
      }
    }
  };

  const handleToggleSubcategoryStatus = async (category: Category, subcategory: Subcategory) => {
    try {
      setError(null);
      setSuccess(null);

      if (!category.category_id || !subcategory.subcategory_id) {
        throw new Error('Category ID and Subcategory ID are required');
      }

      console.log('🔍 CategoryManagement - Toggling subcategory status:', category.category_id, subcategory.subcategory_id, !subcategory.is_active);
      const response = await categoryService.toggleSubcategoryStatus(category.category_id, subcategory.subcategory_id, !subcategory.is_active);

      if (response.success) {
        const action = subcategory.is_active ? 'deactivated' : 'activated';
        setSuccess(`Subcategory "${subcategory.name}" has been ${action} successfully`);
        loadCategories();
      } else {
        throw new Error(response.message || 'Failed to update subcategory status');
      }

    } catch (err: any) {
      console.error('❌ CategoryManagement - Error toggling subcategory status:', err);

      // Check if API is unavailable
      const isApiUnavailable = err.response?.status === 404 ||
                              err.code === 'ECONNREFUSED' ||
                              err.message.includes('Network Error') ||
                              err.message.includes('Failed to fetch');

      if (isApiUnavailable) {
        setError('⚠️ Backend API not available. Please ensure the server is running on port 5000.');
      } else {
        setError(err.message || 'Failed to update subcategory status');
      }
    }
  };

  const handleSave = async (data: Category | Subcategory, parentCat?: Category) => {
    try {
      setModalLoading(true);
      setError(null);
      setSuccess(null);

      let response;

      if (modalMode === 'add_category') {
        console.log('🔍 CategoryManagement - Creating category:', data);
        response = await categoryService.createCategory(data as Category);
        if (response.success) {
          setSuccess(`Category "${data.name}" has been created successfully`);
        }
      } else if (modalMode === 'edit_category') {
        if (!editingCategory?.category_id) {
          throw new Error('Category ID is required for editing');
        }
        console.log('🔍 CategoryManagement - Updating category:', editingCategory.category_id, data);
        response = await categoryService.updateCategory(editingCategory.category_id, data as Category);
        if (response.success) {
          setSuccess(`Category "${data.name}" has been updated successfully`);
        }
      } else if (modalMode === 'add_subcategory') {
        if (!parentCat?.category_id) {
          throw new Error('Parent category ID is required for creating subcategory');
        }
        console.log('🔍 CategoryManagement - Creating subcategory:', data);
        const subcategoryData = {
          ...data as Subcategory,
          category_id: parentCat.category_id
        };
        response = await categoryService.createSubcategory(subcategoryData);
        if (response.success) {
          setSuccess(`Subcategory "${data.name}" has been created successfully`);
        }
      } else if (modalMode === 'edit_subcategory') {
        if (!parentCat?.category_id || !editingSubcategory?.subcategory_id) {
          throw new Error('Category ID and Subcategory ID are required for editing');
        }
        console.log('🔍 CategoryManagement - Updating subcategory:', editingSubcategory.subcategory_id, data);
        response = await categoryService.updateSubcategory(editingSubcategory.subcategory_id!, data as Subcategory);
        if (response.success) {
          setSuccess(`Subcategory "${data.name}" has been updated successfully`);
        }
      }

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to save changes');
      }

      // Reload categories to reflect changes
      await loadCategories();

      // Close modal on successful save
      setShowModal(false);

    } catch (err: any) {
      console.error('❌ CategoryManagement - Error saving:', err);

      // Check if API is unavailable
      const isApiUnavailable = err.response?.status === 404 ||
                              err.code === 'ECONNREFUSED' ||
                              err.message.includes('Network Error') ||
                              err.message.includes('Failed to fetch');

      if (isApiUnavailable) {
        setError('⚠️ Backend API not available. Please ensure the server is running on port 5000.');
      } else {
        setError(err.message || 'Failed to save changes');
      }

      // Don't re-throw error to prevent modal from closing on API errors
    } finally {
      setModalLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (!permissions.canManageCategories) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <FolderTree size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
          Access Denied
        </h2>
        <p style={{ margin: 0, fontSize: '1rem' }}>
          You do not have permission to manage categories and subcategories.
        </p>
        <div style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          background: permissions.getPositionBadgeColor(),
          borderRadius: '6px',
          color: 'white',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          Current Role: {permissions.getPositionDisplayName()}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
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

  if (error) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#ef4444'
      }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button
          onClick={loadCategories}
          style={{
            padding: '0.5rem 1rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>


      {/* Success/Error Messages */}
      {(error || success) && (
        <div style={{ marginBottom: '1.5rem' }}>
          {error && (
            <div style={{
              padding: '1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} />
                {error}
              </div>
              <button
                onClick={clearMessages}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>
          )}

          {success && (
            <div style={{
              padding: '1rem',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} />
                {success}
              </div>
              <button
                onClick={clearMessages}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#166534',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Search and Controls */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        marginBottom: '1.5rem'
      }}>
        {/* Search Bar */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1rem',
          alignItems: 'center'
        }}>
          <button
            onClick={handleAddCategory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
          >
            <Plus size={16} />
            Add Category
          </button>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }}
            />
            <input
              type="text"
              placeholder="Search categories and subcategories..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
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
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '0.25rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Rows Per Page - Moved right after search bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            flexShrink: 0
          }}>
            <label htmlFor="itemsPerPage" style={{ color: '#6b7280' }}>
              Rows per page:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              style={{
                padding: '0.375rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          <span>
            Showing {filteredAndPaginatedData.categories.length} of {filteredAndPaginatedData.totalItems} categories
            {searchQuery && ` (filtered by "${searchQuery}")`}
          </span>
        </div>
      </div>

      {/* Category List */}
      <CategoryList
        categories={filteredAndPaginatedData.categories}
        loading={loading}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        onToggleCategoryStatus={handleToggleCategoryStatus}
        onAddSubcategory={handleAddSubcategory}
        onEditSubcategory={handleEditSubcategory}
        onDeleteSubcategory={handleDeleteSubcategory}
        onToggleSubcategoryStatus={handleToggleSubcategoryStatus}
      />

      {/* Pagination Controls */}
      {filteredAndPaginatedData.totalPages > 1 && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginTop: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            {/* First Page */}
            <button
              onClick={handleFirstPage}
              disabled={currentPage === 1}
              style={{
                padding: '0.5rem',
                backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                color: currentPage === 1 ? '#9ca3af' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Previous Page */}
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                color: currentPage === 1 ? '#9ca3af' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.875rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {/* Page Numbers */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              {(() => {
                const pages = [];
                const totalPages = filteredAndPaginatedData.totalPages;
                const current = currentPage;

                // Show page numbers with ellipsis logic
                if (totalPages <= 7) {
                  // Show all pages if 7 or fewer
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Show first page, ellipsis, current range, ellipsis, last page
                  if (current <= 4) {
                    for (let i = 1; i <= 5; i++) pages.push(i);
                    pages.push('...');
                    pages.push(totalPages);
                  } else if (current >= totalPages - 3) {
                    pages.push(1);
                    pages.push('...');
                    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    pages.push('...');
                    for (let i = current - 1; i <= current + 1; i++) pages.push(i);
                    pages.push('...');
                    pages.push(totalPages);
                  }
                }

                return pages.map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} style={{ padding: '0.5rem', color: '#9ca3af' }}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page as number)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: page === current ? '#3b82f6' : 'white',
                        color: page === current ? 'white' : '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        minWidth: '2.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (page !== current) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (page !== current) {
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      {page}
                    </button>
                  )
                ));
              })()}
            </div>

            {/* Next Page */}
            <button
              onClick={handleNextPage}
              disabled={currentPage === filteredAndPaginatedData.totalPages}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: currentPage === filteredAndPaginatedData.totalPages ? '#f3f4f6' : 'white',
                color: currentPage === filteredAndPaginatedData.totalPages ? '#9ca3af' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                cursor: currentPage === filteredAndPaginatedData.totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.875rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== filteredAndPaginatedData.totalPages) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== filteredAndPaginatedData.totalPages) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>

            {/* Last Page */}
            <button
              onClick={handleLastPage}
              disabled={currentPage === filteredAndPaginatedData.totalPages}
              style={{
                padding: '0.5rem',
                backgroundColor: currentPage === filteredAndPaginatedData.totalPages ? '#f3f4f6' : 'white',
                color: currentPage === filteredAndPaginatedData.totalPages ? '#9ca3af' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                cursor: currentPage === filteredAndPaginatedData.totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== filteredAndPaginatedData.totalPages) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== filteredAndPaginatedData.totalPages) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <ChevronsRight size={16} />
            </button>
          </div>

          {/* Page Info */}
          <div style={{
            textAlign: 'center',
            marginTop: '1rem',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            Page {currentPage} of {filteredAndPaginatedData.totalPages}
          </div>
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        category={editingCategory}
        subcategory={editingSubcategory}
        parentCategory={parentCategory}
        mode={modalMode}
        loading={modalLoading}
      />
    </div>
  );
};

export default CategoryManagement;
