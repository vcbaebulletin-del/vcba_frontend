import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Search, Filter, Download, Eye, Calendar, User, Activity, AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { usePermissions } from '../../utils/permissions';
import { apiClient } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AuditLog {
  log_id: number;
  user_type: 'admin' | 'student' | 'system';
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  action_type: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'SECURITY_EVENT';
  target_table: string;
  target_id: number | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  performed_at: string;
}

interface AuditLogResponse {
  success: boolean;
  message: string;
  data: AuditLog[];
  pagination: {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_records: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

const AuditLogs: React.FC = () => {
  const { user } = useAdminAuth();
  const permissions = usePermissions(user);
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const logsPerPage = 20;

  // Define loadAuditLogs function with useCallback BEFORE useEffect
  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', logsPerPage.toString());

      if (searchTerm) params.append('search', searchTerm);
      if (selectedUser) params.append('user_id', selectedUser);
      if (selectedAction) params.append('action_type', selectedAction);
      if (selectedSeverity) params.append('severity', selectedSeverity);
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);

      console.log('🔍 Making audit logs request:', {
        url: `/api/audit-logs?${params.toString()}`,
        params: Object.fromEntries(params.entries())
      });

      const response = await apiClient.get<AuditLogResponse>(`/api/audit-logs?${params.toString()}`);

      if (response.data.success) {
        setLogs(response.data.data);
        setTotalPages(response.data.pagination.total_pages);
        console.log('✅ Audit logs loaded successfully:', response.data.data.length, 'logs');
      } else {
        throw new Error(response.data.message || 'Failed to load audit logs');
      }
    } catch (err: any) {
      console.error('❌ Error loading audit logs:', err);

      // Enhanced error logging
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        console.error('Response headers:', err.response.headers);
      }

      // Provide more specific error messages
      let errorMessage = 'Failed to load audit logs';
      if (err.response?.status === 404) {
        errorMessage = 'Audit logs endpoint not found. Please ensure the backend server is running.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. You need super admin permissions to view audit logs.';
      } else if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on port 5000.';
      }

      setError(errorMessage);

      // Fallback to empty array on error
      setLogs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedUser, selectedAction, selectedSeverity, dateRange, logsPerPage]);

  // useEffect to load audit logs when dependencies change
  useEffect(() => {
    if (permissions.isSuperAdmin) {
      loadAuditLogs();
    }
  }, [permissions.isSuperAdmin, loadAuditLogs]);

  // Permission check - early return if not super admin
  if (!permissions.isSuperAdmin) {
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
        <Shield size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
          Access Denied
        </h2>
        <p style={{ margin: 0, fontSize: '1rem' }}>
          System audit logs are restricted to Super Administrators only.
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

  const getActionTypeColor = (actionType: AuditLog['action_type']) => {
    switch (actionType) {
      case 'CREATE': return '#10b981';
      case 'READ': return '#3b82f6';
      case 'UPDATE': return '#f59e0b';
      case 'DELETE': return '#ef4444';
      case 'LOGIN': return '#8b5cf6';
      case 'LOGOUT': return '#6b7280';
      case 'EXPORT': return '#06b6d4';
      case 'SECURITY_EVENT': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getActionTypeBadge = (actionType: AuditLog['action_type']) => (
    <span style={{
      padding: '0.25rem 0.5rem',
      background: getActionTypeColor(actionType),
      color: 'white',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: '600'
    }}>
      {actionType}
    </span>
  );

  const getUserTypeBadge = (userType: AuditLog['user_type']) => {
    const colors = {
      admin: '#3b82f6',
      student: '#10b981',
      system: '#6b7280'
    };

    return (
      <span style={{
        padding: '0.25rem 0.5rem',
        background: colors[userType],
        color: 'white',
        borderRadius: '0.375rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'capitalize'
      }}>
        {userType}
      </span>
    );
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return <User size={16} />;
    if (action.includes('CREATE')) return <Activity size={16} />;
    if (action.includes('UPDATE')) return <Eye size={16} />;
    if (action.includes('DELETE')) return <AlertTriangle size={16} />;
    return <Activity size={16} />;
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      setLoading(true);

      // Build query parameters for export
      const params = new URLSearchParams();
      params.append('format', format);

      if (searchTerm) params.append('search', searchTerm);
      if (selectedUser) params.append('user_id', selectedUser);
      if (selectedAction) params.append('action_type', selectedAction);
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);

      const response = await apiClient.get(`/api/audit-logs/export?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error('Error exporting audit logs:', err);
      setError(err.response?.data?.message || err.message || 'Failed to export audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handlePDFExport = async () => {
    try {
      setLoading(true);

      // Create new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('VCBA E-Bulletin System', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(16);
      doc.text('Audit Logs Report', pageWidth / 2, 30, { align: 'center' });

      // Date range and generation info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const dateRangeText = `Date Range: ${dateRange.start || 'All'} to ${dateRange.end || 'All'}`;
      const generatedAt = `Generated: ${new Date().toLocaleString()}`;
      doc.text(dateRangeText, 20, 40);
      doc.text(generatedAt, pageWidth - 20, 40, { align: 'right' });

      // Prepare table data
      const tableData = logs.map(log => [
        new Date(log.performed_at).toLocaleDateString(),
        new Date(log.performed_at).toLocaleTimeString(),
        log.user_type || 'N/A',
        log.user_name || log.user_email || `ID: ${log.user_id}` || 'System',
        log.action_type,
        log.target_table,
        log.description.length > 50 ? log.description.substring(0, 50) + '...' : log.description
      ]);

      // Add table
      autoTable(doc, {
        head: [['Date', 'Time', 'User Type', 'User', 'Action', 'Table', 'Description']],
        body: tableData,
        startY: 50,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { left: 10, right: 10 },
        didDrawPage: (data: any) => {
          // Footer
          const pageCount = (doc as any).getNumberOfPages();
          const pageNumber = data.pageNumber;

          doc.setFontSize(8);
          doc.text(
            `Page ${pageNumber} of ${pageCount} | Total Records: ${logs.length}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
        }
      });

      // Save the PDF
      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`audit-logs-report-${timestamp}.pdf`);

    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAuditLogs();
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          {/* Header text elements removed as requested */}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: loading ? '#f3f4f6' : '#10b981',
              color: loading ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#059669';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#10b981';
            }}
          >
            <RefreshCw size={16} style={{
              animation: loading ? 'spin 1s linear infinite' : 'none'
            }} />
            Refresh
          </button>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: showFilters ? '#3b82f6' : 'white',
              color: showFilters ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!showFilters) {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }
            }}
            onMouseLeave={(e) => {
              if (!showFilters) {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }
            }}
          >
            <Filter size={16} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Export Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleExport('csv')}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: loading ? '#9ca3af' : '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#4f46e5';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = '#6366f1';
              }}
            >
              <Download size={16} />
              Export CSV
            </button>

            <button
              onClick={() => handleExport('json')}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: loading ? '#9ca3af' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#047857';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = '#059669';
              }}
            >
              <Download size={16} />
              Export JSON
            </button>

            <button
              onClick={handlePDFExport}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: loading ? '#9ca3af' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = '#dc2626';
              }}
            >
              <FileText size={16} />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Action
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="READ">Read</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="EXPORT">Export</option>
                <option value="SECURITY_EVENT">Security Event</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Severity
              </label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Logs Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {loading ? (
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
        ) : logs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#6b7280'
          }}>
            <Shield size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: '600' }}>
              No audit logs found
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              No logs match your current filters
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Timestamp
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    User
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Action
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Target
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Description
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr
                    key={log.log_id}
                    style={{
                      borderBottom: index < logs.length - 1 ? '1px solid #f3f4f6' : 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedLog(log)}
                  >
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} color="#6b7280" />
                        {new Date(log.performed_at).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          {getUserTypeBadge(log.user_type)}
                          <span style={{ fontWeight: '600' }}>{log.user_name || 'System'}</span>
                        </div>
                        {log.user_email && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{log.user_email}</div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getActionIcon(log.action_type)}
                        {getActionTypeBadge(log.action_type)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{log.target_table}</div>
                        {log.target_id && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>ID: {log.target_id}</div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151', maxWidth: '300px' }}>
                      <div style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'help'
                      }} title={log.description}>
                        {log.description}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151', fontFamily: 'monospace' }}>
                      {log.ip_address || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === 1 ? '#f3f4f6' : '#3b82f6',
              color: currentPage === 1 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === totalPages ? '#f3f4f6' : '#3b82f6',
              color: currentPage === totalPages ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
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

export default AuditLogs;