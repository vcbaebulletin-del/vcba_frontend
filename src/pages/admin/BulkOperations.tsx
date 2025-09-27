import React, { useState, useRef } from 'react';
import { Upload, Download, Users, FileText, Calendar, Trash2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { usePermissions } from '../../utils/permissions';

interface BulkOperation {
  id: string;
  type: 'student_import' | 'student_export' | 'announcement_bulk_delete' | 'event_bulk_delete';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total: number;
  processed: number;
  errors: string[];
  createdAt: Date;
  completedAt?: Date;
}

const BulkOperations: React.FC = () => {
  const { user } = useAdminAuth();
  const permissions = usePermissions(user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'bulk_actions' | 'history'>('import');
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Import/Export states
  const [importType, setImportType] = useState<'students' | 'announcements' | 'events'>('students');
  const [exportType, setExportType] = useState<'students' | 'announcements' | 'events'>('students');
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Bulk action states
  const [bulkActionType, setBulkActionType] = useState<'delete_inactive_students' | 'archive_old_announcements' | 'cleanup_old_events'>('delete_inactive_students');

  // Permission check
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
        <Upload size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
          Access Denied
        </h2>
        <p style={{ margin: 0, fontSize: '1rem' }}>
          Bulk operations are restricted to Super Administrators only.
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a file to import');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Implement actual import API call
      // const formData = new FormData();
      // formData.append('file', selectedFile);
      // formData.append('type', importType);
      // const response = await bulkOperationsService.importData(formData);

      // Mock import process
      const newOperation: BulkOperation = {
        id: Date.now().toString(),
        type: 'student_import',
        status: 'processing',
        progress: 0,
        total: 100,
        processed: 0,
        errors: [],
        createdAt: new Date()
      };

      setOperations(prev => [newOperation, ...prev]);

      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setOperations(prev => prev.map(op => 
          op.id === newOperation.id 
            ? { ...op, progress, processed: progress }
            : op
        ));

        if (progress >= 100) {
          clearInterval(interval);
          setOperations(prev => prev.map(op => 
            op.id === newOperation.id 
              ? { ...op, status: 'completed', completedAt: new Date() }
              : op
          ));
          setSuccess(`Successfully imported ${importType} data`);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      }, 500);

    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Implement actual export API call
      // const response = await bulkOperationsService.exportData({
      //   type: exportType,
      //   format: exportFormat
      // });

      // Mock export process
      const newOperation: BulkOperation = {
        id: Date.now().toString(),
        type: 'student_export',
        status: 'processing',
        progress: 0,
        total: 100,
        processed: 0,
        errors: [],
        createdAt: new Date()
      };

      setOperations(prev => [newOperation, ...prev]);

      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        setOperations(prev => prev.map(op => 
          op.id === newOperation.id 
            ? { ...op, progress, processed: progress }
            : op
        ));

        if (progress >= 100) {
          clearInterval(interval);
          setOperations(prev => prev.map(op => 
            op.id === newOperation.id 
              ? { ...op, status: 'completed', completedAt: new Date() }
              : op
          ));
          setSuccess(`Successfully exported ${exportType} data as ${exportFormat.toUpperCase()}`);
          
          // Mock file download
          const blob = new Blob(['Mock exported data'], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${exportType}_export.${exportFormat}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 300);

    } catch (err: any) {
      setError(err.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Implement actual bulk action API call
      // const response = await bulkOperationsService.performBulkAction(bulkActionType);

      // Mock bulk action
      const actionNames = {
        delete_inactive_students: 'Delete Inactive Students',
        archive_old_announcements: 'Archive Old Announcements',
        cleanup_old_events: 'Cleanup Old Events'
      };

      const newOperation: BulkOperation = {
        id: Date.now().toString(),
        type: 'announcement_bulk_delete',
        status: 'processing',
        progress: 0,
        total: 50,
        processed: 0,
        errors: [],
        createdAt: new Date()
      };

      setOperations(prev => [newOperation, ...prev]);

      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setOperations(prev => prev.map(op => 
          op.id === newOperation.id 
            ? { ...op, progress, processed: Math.floor(progress * 0.5) }
            : op
        ));

        if (progress >= 100) {
          clearInterval(interval);
          setOperations(prev => prev.map(op => 
            op.id === newOperation.id 
              ? { ...op, status: 'completed', completedAt: new Date() }
              : op
          ));
          setSuccess(`Successfully completed: ${actionNames[bulkActionType]}`);
        }
      }, 400);

    } catch (err: any) {
      setError(err.message || 'Bulk action failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: BulkOperation['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color="#10b981" />;
      case 'failed':
        return <AlertTriangle size={16} color="#ef4444" />;
      case 'processing':
        return <RefreshCw size={16} color="#3b82f6" className="animate-spin" />;
      default:
        return <RefreshCw size={16} color="#6b7280" />;
    }
  };

  const tabs = [
    { key: 'import', label: 'Import Data', icon: Upload },
    { key: 'export', label: 'Export Data', icon: Download },
    { key: 'bulk_actions', label: 'Bulk Actions', icon: Trash2 },
    { key: 'history', label: 'Operation History', icon: FileText }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            margin: '0 0 0.5rem',
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            Bulk Operations
          </h1>
          <p style={{
            margin: 0,
            color: '#6b7280',
            fontSize: '1rem'
          }}>
            Import, export, and perform bulk actions on system data
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          background: '#dc2626',
          color: 'white',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          <Users size={16} />
          Super Admin Only
        </div>
      </div>

      {/* Error/Success Messages */}
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

      {success && (
        <div style={{
          padding: '1rem',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          color: '#166534',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '2rem'
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem 1.5rem',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.key ? '#3b82f6' : '#6b7280',
                borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '2rem'
      }}>
        {activeTab === 'import' && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
              Import Data
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Data Type
                </label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as any)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                >
                  <option value="students">Students</option>
                  <option value="announcements">Announcements</option>
                  <option value="events">Calendar Events</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Select File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.json"
                  onChange={handleFileSelect}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <button
              onClick={handleImport}
              disabled={loading || !selectedFile}
              style={{
                padding: '0.75rem 1.5rem',
                background: loading || !selectedFile ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading || !selectedFile ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Upload size={16} />
              {loading ? 'Importing...' : 'Import Data'}
            </button>
          </div>
        )}

        {activeTab === 'export' && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
              Export Data
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Data Type
                </label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as any)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                >
                  <option value="students">Students</option>
                  <option value="announcements">Announcements</option>
                  <option value="events">Calendar Events</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Export Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                >
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel (XLSX)</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Download size={16} />
              {loading ? 'Exporting...' : 'Export Data'}
            </button>
          </div>
        )}

        {activeTab === 'bulk_actions' && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
              Bulk Actions
            </h3>
            
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Select Action
              </label>
              <select
                value={bulkActionType}
                onChange={(e) => setBulkActionType(e.target.value as any)}
                style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
              >
                <option value="delete_inactive_students">Delete Inactive Students (30+ days)</option>
                <option value="archive_old_announcements">Archive Old Announcements (90+ days)</option>
                <option value="cleanup_old_events">Cleanup Old Events (180+ days)</option>
              </select>
            </div>

            <button
              onClick={handleBulkAction}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: loading ? '#9ca3af' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Trash2 size={16} />
              {loading ? 'Processing...' : 'Execute Bulk Action'}
            </button>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
              Operation History
            </h3>
            
            {operations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No operations performed yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {operations.map((operation) => (
                  <div
                    key={operation.id}
                    style={{
                      padding: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {getStatusIcon(operation.status)}
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>
                          {operation.type.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {operation.createdAt.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                        {operation.processed}/{operation.total}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {operation.status === 'processing' ? `${operation.progress}%` : operation.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkOperations;
