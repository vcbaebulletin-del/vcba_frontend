import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, RotateCcw, User, Mail, Phone, GraduationCap, Calendar, UserCheck } from 'lucide-react';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { archiveService, ArchivedStudent, ArchiveFilters, ArchivePagination } from '../../../services/archiveService';

interface ArchivedStudentsProps {
  onRestoreSuccess?: () => void;
}

const ArchivedStudents: React.FC<ArchivedStudentsProps> = ({ onRestoreSuccess }) => {
  const { isAuthenticated } = useAdminAuth();
  const [students, setStudents] = useState<ArchivedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [restoring, setRestoring] = useState<number | null>(null);
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

  // Filter students using useMemo for performance
  const filteredStudents = useMemo(() => {
    if (searchQuery.trim() === '') {
      return students;
    }

    return students.filter(student =>
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.profile?.first_name && student.profile.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.profile?.last_name && student.profile.last_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.profile?.full_name && student.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.profile?.grade_level && student.profile.grade_level.toString().includes(searchQuery))
    );
  }, [students, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      loadStudents();
    } else {
      setError('Authentication required to access archived students');
      setLoading(false);
    }
  }, [isAuthenticated]); // Load all data once, like CategoryManagement

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: ArchiveFilters = {};
      // Remove server-side search since we're doing client-side filtering

      const pagination: ArchivePagination = {
        page: 1,
        limit: 100, // Use reasonable limit to avoid backend validation errors
        sort_by: 'updated_at',
        sort_order: 'DESC'
      };

      const response = await archiveService.getArchivedStudents(filters, pagination);

      if (response.success && response.data && response.data.data) {
        setStudents(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotal(response.data.pagination?.total || 0);
      } else {
        setError('Failed to load archived students');
      }
    } catch (error: any) {
      console.error('Error loading archived students:', error);
      console.error('Error details:', error.response?.data || error);
      setError(error.message || 'Failed to load archived students');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (studentId: number) => {
    if (!window.confirm('Are you sure you want to restore this student account?')) {
      return;
    }

    try {
      setRestoring(studentId);
      const response = await archiveService.restoreStudent(studentId);
      
      if (response.success) {
        alert('Student account restored successfully!');
        await loadStudents();
        onRestoreSuccess?.();
      } else {
        alert('Failed to restore student account');
      }
    } catch (error: any) {
      console.error('Error restoring student:', error);
      alert(error.message || 'Failed to restore student account');
    } finally {
      setRestoring(null);
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

  const getGradeLevelColor = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 11:
        return '#3b82f6';
      case 12:
        return '#10b981';
      default:
        return '#6b7280';
    }
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
            borderTop: '3px solid #f59e0b',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          Loading archived students...
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
            placeholder="Search archived students..."
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
          {total} archived student{total !== 1 ? 's' : ''}
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

      {/* Students List */}
      {!students || students.length === 0 ? (
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
            <User size={24} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: '600' }}>
            No archived students found
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            {searchQuery ? 'Try adjusting your search terms' : 'No student accounts have been archived yet'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredStudents && filteredStudents.map((student) => (
            <div
              key={student.student_id}
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
                <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
                  {/* Profile Picture */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {student.profile?.profile_picture ? (
                      <img
                        src={`http://localhost:5000${student.profile.profile_picture}`}
                        alt={`${student.profile?.first_name || 'Student'} ${student.profile?.last_name || ''}`}
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
                        display: student.profile?.profile_picture ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6b7280'
                      }}
                    >
                      <User size={24} />
                    </div>
                  </div>

                  {/* Student Info */}
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
                        {student.profile?.full_name || 'No Name Provided'}
                      </h3>
                      <div style={{
                        background: '#fef3c7',
                        color: '#d97706',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        Inactive
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#374151'
                      }}>
                        <Mail size={16} color="#f59e0b" />
                        <span style={{ fontWeight: '500' }}>Email:</span>
                        <span>{student.email}</span>
                      </div>

                      {student.profile?.grade_level && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          color: '#374151'
                        }}>
                          <GraduationCap size={16} color="#f59e0b" />
                          <span style={{ fontWeight: '500' }}>Grade:</span>
                          <span style={{
                            background: `${getGradeLevelColor(student.profile.grade_level)}20`,
                            color: getGradeLevelColor(student.profile.grade_level),
                            padding: '0.125rem 0.375rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            Grade {student.profile.grade_level}
                          </span>
                        </div>
                      )}

                    </div>

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User size={12} />
                        Created by: {student.created_by_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} />
                        Deactivated: {formatDate(student.updated_at)}
                      </div>
                      {student.last_login && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={12} />
                          Last login: {formatDate(student.last_login)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginLeft: '1rem'
                }}>
                  <button
                    onClick={() => handleRestore(student.student_id)}
                    disabled={restoring === student.student_id}
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
                      cursor: restoring === student.student_id ? 'not-allowed' : 'pointer',
                      opacity: restoring === student.student_id ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (restoring !== student.student_id) {
                        e.currentTarget.style.background = '#059669';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (restoring !== student.student_id) {
                        e.currentTarget.style.background = '#10b981';
                      }
                    }}
                  >
                    <RotateCcw size={14} />
                    {restoring === student.student_id ? 'Restoring...' : 'Restore'}
                  </button>
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
          Showing {students.length} of {total} archived students
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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
              background: currentPage === 1 ? '#f3f4f6' : '#f59e0b',
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
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === totalPages ? '#f3f4f6' : '#f59e0b',
              color: currentPage === totalPages ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ArchivedStudents;
