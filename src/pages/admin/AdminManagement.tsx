import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserPlus, Search, X, Filter, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { LOGIN_ROUTE } from '../../config/constants';
import { usePermissions } from '../../utils/permissions';
import { adminManagementService } from '../../services/adminManagementService';
import AdminAccountList from '../../components/admin/AdminAccountList';
import AdminAccountModal from '../../components/admin/AdminAccountModal';
import { AdminAccount } from '../../types/admin.types';

const AdminManagement: React.FC = () => {
  const { user } = useAdminAuth();
  const permissions = usePermissions(user);

  // State management
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Navigation state for role tabs (only active accounts shown)
  const [activeRole, setActiveRole] = useState<'super_admin' | 'professor'>('super_admin');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Reset to page 1 when filters change or active role changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, positionFilter, statusFilter, activeRole]);

  const loadAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 AdminManagement - Loading all admins for client-side filtering');

      const response = await adminManagementService.getAdmins({
        page: 1,
        limit: 100, // Use reasonable limit to avoid backend validation errors
        search: '',
        position: '',
        status: ''
      });

      console.log('📥 AdminManagement - API response:', response);

      if (response.success && response.data) {
        setAdmins(response.data.admins);
        setTotalItems(response.data.pagination.totalItems);
        console.log('✅ AdminManagement - Admins loaded successfully:', response.data.admins.length);
      } else {
        throw new Error(response.message || 'Failed to load admin accounts');
      }

    } catch (err: any) {
      console.error('❌ AdminManagement - Error loading admins:', err);
      console.error('❌ AdminManagement - Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

      // Provide more detailed error information
      let errorMessage = 'Failed to load admin accounts';
      if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        // Optionally redirect to login after a delay
        setTimeout(() => {
          window.location.href = LOGIN_ROUTE;
        }, 3000);
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to access admin management.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []); // Load all data once, like CategoryManagement

  useEffect(() => {
    console.log('🔍 AdminManagement - useEffect triggered with:', {
      user,
      permissions: {
        canManageAdmins: permissions.canManageAdmins,
        isSuperAdmin: permissions.isSuperAdmin,
        isProfessor: permissions.isProfessor
      },
      currentPage,
      itemsPerPage,
      searchQuery,
      positionFilter,
      statusFilter
    });

    // Check if user has permission to manage admins
    if (!permissions.canManageAdmins) {
      console.log('❌ AdminManagement - No permission to manage admins');
      setError('You do not have permission to manage admin accounts');
      setLoading(false);
      return;
    }

    console.log('✅ AdminManagement - Permission granted, loading admins');
    loadAdmins();
  }, [permissions.canManageAdmins, loadAdmins]);

  // Search handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Filter and paginate admins using useMemo for performance (like CategoryManagement)
  const filteredAndPaginatedData = useMemo(() => {
    // First filter by active role (super_admin or professor)
    const roleFilteredAdmins = admins.filter(admin => admin.profile.position === activeRole);

    // Then apply search query, position filter, and status filter
    const filteredAdmins = roleFilteredAdmins.filter(admin => {
      const matchesSearch = searchQuery.trim() === '' ||
        admin.profile.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.profile.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPosition = positionFilter === '' || admin.profile.position === positionFilter;
      const matchesStatus = statusFilter === '' ||
        (statusFilter === 'active' && admin.is_active) ||
        (statusFilter === 'inactive' && !admin.is_active);

      return matchesSearch && matchesPosition && matchesStatus;
    });

    // Calculate pagination based on the filtered results for this role only
    const totalFiltered = filteredAdmins.length;
    const totalPages = Math.ceil(totalFiltered / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedAdmins = filteredAdmins.slice(startIndex, endIndex);

    return {
      admins: paginatedAdmins,
      totalItems: totalFiltered,
      totalPages,
      currentPage,
      itemsPerPage
    };
  }, [admins, activeRole, searchQuery, positionFilter, statusFilter, currentPage, itemsPerPage]);

  // Handler functions
  const handleAddAdmin = () => {
    setEditingAdmin(null);
    setShowModal(true);
  };

  const handleEditAdmin = (admin: AdminAccount) => {
    setEditingAdmin(admin);
    setShowModal(true);
  };

  const handleDeleteAdmin = async (admin: AdminAccount) => {
    try {
      setError(null);
      setSuccess(null);

      if (!admin.admin_id) {
        throw new Error('Admin ID is required');
      }

      await adminManagementService.deleteAdmin(admin.admin_id);
      setSuccess(`Admin account for ${admin.profile.full_name} has been deactivated`);
      loadAdmins();

    } catch (err: any) {
      setError(err.message || 'Failed to delete admin account');
    }
  };

  const handleToggleStatus = async (adminId: number) => {
    try {
      setError(null);
      setSuccess(null);

      const admin = admins.find(a => a.admin_id === adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      await adminManagementService.toggleAdminStatus(adminId, !admin.is_active);
      const action = admin.is_active ? 'deactivated' : 'activated';
      setSuccess(`Admin account for ${admin.profile.full_name} has been ${action}`);
      loadAdmins();

    } catch (err: any) {
      setError(err.message || 'Failed to update admin status');
    }
  };

  const handleSaveAdmin = async (adminData: AdminAccount) => {
    try {
      setModalLoading(true);
      setError(null);
      setSuccess(null);

      if (editingAdmin && editingAdmin.admin_id) {
        // Update existing admin
        await adminManagementService.updateAdmin(editingAdmin.admin_id, adminData);
        setSuccess(`Admin account for ${adminData.profile.first_name} ${adminData.profile.last_name} has been updated`);
      } else {
        // Create new admin
        const createData = { ...adminData, password: (adminData as any).password };
        await adminManagementService.createAdmin(createData);
        setSuccess(`Admin account for ${adminData.profile.first_name} ${adminData.profile.last_name} has been created`);
      }

      loadAdmins();
      setShowModal(false);

    } catch (err: any) {
      setError(err.message || 'Failed to save admin account');
      throw err; // Re-throw to prevent modal from closing
    } finally {
      setModalLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setItemsPerPage(itemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (!permissions.canManageAdmins) {
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
        <Users size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
          Access Denied
        </h2>
        <p style={{ margin: 0, fontSize: '1rem' }}>
          You do not have permission to manage admin accounts.
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
    const isAuthError = error.includes('Authentication failed') || error.includes('Unauthorized');

    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#ef4444'
      }}>
        <h2>Error</h2>
        <p>{error}</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {isAuthError ? (
            <button
              onClick={() => window.location.href = LOGIN_ROUTE}
              style={{
                padding: '0.5rem 1rem',
                background: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Go to Login
            </button>
          ) : (
            <button
              onClick={loadAdmins}
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
          )}
        </div>
      </div>
    );
  }

  return (
    <div>

      {/* Search and Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleAddAdmin}
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
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
        >
          <UserPlus size={16} />
          Add Admin
        </button>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }} />
            <input
              type="text"
              placeholder="Search admins by name or email..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
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

        {/* I will comment this position filter because I have already separate list of them */}
        {/* <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '0.875rem',
            minWidth: '150px'
          }}
        >
          <option value="">All Positions</option>
          <option value="super_admin">Super Admin</option>
          <option value="professor">Professor</option>
        </select> */}

        {/* I will comment this status filter because the adminmanagement is only showing active */}
        {/* <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '0.875rem',
            minWidth: '120px'
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select> */}

        {/* I will comment this row conttler for now */}
        {/* <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Show:
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              style={{
                marginLeft: '0.5rem',
                padding: '0.25rem 0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div> */}
      </div>

      {/* Navigation Tabs */}
      <div style={{ marginBottom: '2rem' }}>
        {/* Role Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #e5e7eb',
          marginBottom: '1rem'
        }}>
          <button
            onClick={() => {
              setActiveRole('super_admin');
              setCurrentPage(1);
            }}
            style={{
              padding: '1rem 2rem',
              background: activeRole === 'super_admin' ? '#dc2626' : 'transparent',
              color: activeRole === 'super_admin' ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: activeRole === 'super_admin' ? '3px solid #dc2626' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            Super Admins
          </button>
          <button
            onClick={() => {
              setActiveRole('professor');
              setCurrentPage(1);
            }}
            style={{
              padding: '1rem 2rem',
              background: activeRole === 'professor' ? '#2563eb' : 'transparent',
              color: activeRole === 'professor' ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: activeRole === 'professor' ? '3px solid #2563eb' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            Professors
          </button>
        </div>

      </div>

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

      {/* Admin List */}
      <AdminAccountList
        admins={filteredAndPaginatedData.admins}
        loading={loading}
        onEdit={handleEditAdmin}
        onToggleStatus={handleToggleStatus}
        currentPage={filteredAndPaginatedData.currentPage}
        itemsPerPage={filteredAndPaginatedData.itemsPerPage}
        totalItems={filteredAndPaginatedData.totalItems}
        onPageChange={setCurrentPage}
        activeRole={activeRole}
      />

      {/* Admin Modal */}
      <AdminAccountModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveAdmin}
        admin={editingAdmin}
        loading={modalLoading}
      />
    </div>
  );
};

export default AdminManagement;
