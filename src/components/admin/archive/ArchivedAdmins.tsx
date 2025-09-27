import React, { useState, useEffect, useMemo } from 'react';
import { User, Eye, RotateCcw, Search, X, Filter } from 'lucide-react';
import { AdminAccount } from '../../../types/admin.types';
import { adminManagementService } from '../../../services/adminManagementService';

interface ArchivedAdminsProps {
  onRestoreSuccess?: () => void;
}

const getProfileImageUrl = (profilePicture: string | null): string => {
  if (!profilePicture) {
    return '/api/placeholder/40/40';
  }

  // Handle different URL formats
  let url = profilePicture;
  if (url.startsWith('/uploads/')) {
    url = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${url}`;
  } else if (!url.startsWith('http')) {
    url = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/uploads/profile_pictures/${url}`;
  }

  return url;
};

const ArchivedAdmins: React.FC<ArchivedAdminsProps> = ({ onRestoreSuccess }) => {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'professor'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Search handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Client-side filtering using useMemo (like CategoryManagement)
  const filteredAndPaginatedData = useMemo(() => {
    // Filter admins based on search query and role filter
    const filteredAdmins = admins.filter(admin => {
      const matchesSearch = searchQuery.trim() === '' ||
        admin.profile.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.profile.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (admin.profile.full_name && admin.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = roleFilter === 'all' || admin.profile.position === roleFilter;

      return matchesSearch && matchesRole;
    });

    // Calculate pagination
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
  }, [admins, searchQuery, roleFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    loadInactiveAdmins();
  }, []); // Load all data once, like CategoryManagement

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const loadInactiveAdmins = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminManagementService.getAdmins({
        page: 1,
        limit: 100, // Use reasonable limit to avoid backend validation errors
        search: '',
        position: '',
        status: 'inactive'
      });

      if (response.success && response.data) {
        setAdmins(response.data.admins);
        setTotalItems(response.data.pagination.totalItems);
      } else {
        setError('Failed to load inactive admins');
        setAdmins([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      console.error('Error loading inactive admins:', error);
      setError(error.message || 'Failed to load inactive admins');
      setAdmins([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (admin: AdminAccount) => {
    const confirmed = window.confirm(
      `Are you sure you want to restore this user? This will reactivate their admin account and they will be able to access the system again.`
    );
    
    if (!confirmed) return;

    try {
      if (!admin.admin_id) return;
      const response = await adminManagementService.toggleAdminStatus(admin.admin_id, true);
      if (response.success) {
        await loadInactiveAdmins();
        if (onRestoreSuccess) {
          onRestoreSuccess();
        }
      } else {
        setError('Failed to restore admin account');
      }
    } catch (error: any) {
      console.error('Error restoring admin:', error);
      setError(error.message || 'Failed to restore admin account');
    }
  };

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

  // Use filtered data for pagination calculations
  const totalPages = filteredAndPaginatedData.totalPages;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: '#6b7280'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #dc2626',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          Loading inactive admins...
        </div>
      </div>
    );
  }

  return (
    <div>
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

      {/* Search and Filter Controls */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1', minWidth: '250px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }} />
            <input
              type="text"
              placeholder="Search inactive admins..."
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

        <div style={{ minWidth: '150px' }}>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as 'all' | 'super_admin' | 'professor');
              setCurrentPage(1); // Reset to first page when changing role filter
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.875rem',
              background: 'white'
            }}
          >
            <option value="all">All Positions</option>
            <option value="super_admin">Super Admins</option>
            <option value="professor">Professors</option>
          </select>
        </div>
      </div>

      {/* Admin List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredAndPaginatedData.admins.length === 0 ? (
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
              No inactive admins found
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              {searchQuery || roleFilter !== 'all'
                ? 'No inactive admins match your search criteria.'
                : 'All admin accounts are currently active.'}
            </p>
          </div>
        ) : (
          filteredAndPaginatedData.admins.map((admin) => (
            <div
              key={admin.admin_id}
              style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                padding: '1.5rem',
                opacity: 0.7
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {admin.profile.profile_picture ? (
                    <img
                      src={getProfileImageUrl(admin.profile.profile_picture)}
                      alt={`${admin.profile.first_name} ${admin.profile.last_name}`}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #e5e7eb'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const defaultAvatar = target.nextElementSibling as HTMLElement;
                        if (defaultAvatar) defaultAvatar.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#f3f4f6',
                      border: '2px solid #e5e7eb',
                      display: admin.profile.profile_picture ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: '600',
                      color: '#6b7280'
                    }}
                  >
                    <User size={24} />
                  </div>
                  <div>
                    <h3 style={{
                      margin: '0 0 0.25rem',
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      {admin.profile.first_name} {admin.profile.last_name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: getPositionBadgeColor(admin.profile.position),
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {getPositionDisplayName(admin.profile.position)}
                      </span>
                      {admin.profile.position === 'professor' && admin.profile.grade_level && (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: '#f3f4f6',
                          color: '#6b7280',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          Grade {admin.profile.grade_level}
                        </span>
                      )}
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: '#fef2f2',
                        color: '#dc2626',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        Inactive
                      </span>
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      {admin.email}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleRestore(admin)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
                  >
                    <RotateCcw size={16} />
                    Restore
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
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
          Showing {filteredAndPaginatedData.admins.length} of {filteredAndPaginatedData.totalItems} inactive admins
          {searchQuery && ` (filtered by "${searchQuery}")`}
          {roleFilter !== 'all' && ` (${roleFilter} only)`}
        </div>
      </div>

      {/* Pagination */}
      {filteredAndPaginatedData.totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '2rem',
          padding: '1rem'
        }}>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === 1 ? '#f3f4f6' : '#dc2626',
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
            {Array.from({ length: Math.min(5, filteredAndPaginatedData.totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: currentPage === page ? '#dc2626' : 'white',
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
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === filteredAndPaginatedData.totalPages}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === filteredAndPaginatedData.totalPages ? '#f3f4f6' : '#dc2626',
              color: currentPage === filteredAndPaginatedData.totalPages ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === filteredAndPaginatedData.totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ArchivedAdmins;
