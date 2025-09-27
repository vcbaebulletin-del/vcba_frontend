import React, { useState, useEffect } from 'react';
import { adminAnnouncementServiceWithToken, studentAnnouncementServiceWithToken } from '../../services/announcementService';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useStudentAuth } from '../../contexts/StudentAuthContext';

const ApiTest: React.FC = () => {
  const [adminResults, setAdminResults] = useState<any>(null);
  const [studentResults, setStudentResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user: adminUser, isAuthenticated: isAdminAuth } = useAdminAuth();
  const { user: studentUser, isAuthenticated: isStudentAuth } = useStudentAuth();

  const testAdminAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🧪 Testing Admin API...');
      
      const response = await adminAnnouncementServiceWithToken.getAnnouncements({
        status: 'published',
        limit: 5
      });
      
      console.log('🧪 Admin API Response:', response);
      setAdminResults(response);
    } catch (err: any) {
      console.error('🧪 Admin API Error:', err);
      setError(`Admin API Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testStudentAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🧪 Testing Student API...');
      
      const response = await studentAnnouncementServiceWithToken.getAnnouncements({
        status: 'published',
        limit: 5
      });
      
      console.log('🧪 Student API Response:', response);
      setStudentResults(response);
    } catch (err: any) {
      console.error('🧪 Student API Error:', err);
      setError(`Student API Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🧪 Testing Direct API...');
      
      const response = await fetch('http://localhost:5000/api/announcements?status=published&limit=5');
      const data = await response.json();
      
      console.log('🧪 Direct API Response:', data);
      setAdminResults(data);
    } catch (err: any) {
      console.error('🧪 Direct API Error:', err);
      setError(`Direct API Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkTokens = () => {
    const adminToken = localStorage.getItem('vcba_admin_auth_token');
    const studentToken = localStorage.getItem('vcba_student_auth_token');
    const adminUser = localStorage.getItem('vcba_admin_user_data');
    const studentUser = localStorage.getItem('vcba_student_user_data');

    console.log('🔑 Token Check:', {
      hasAdminToken: !!adminToken,
      hasStudentToken: !!studentToken,
      hasAdminUser: !!adminUser,
      hasStudentUser: !!studentUser,
      adminTokenPreview: adminToken ? adminToken.substring(0, 20) + '...' : null,
      studentTokenPreview: studentToken ? studentToken.substring(0, 20) + '...' : null
    });
  };

  useEffect(() => {
    checkTokens();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>API Debug Test</h1>
      
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Authentication Status</h3>
        <p><strong>Admin Auth:</strong> {isAdminAuth ? '✅ Authenticated' : '❌ Not Authenticated'}</p>
        <p><strong>Admin User:</strong> {adminUser ? `${adminUser.email} (${adminUser.role})` : 'None'}</p>
        <p><strong>Student Auth:</strong> {isStudentAuth ? '✅ Authenticated' : '❌ Not Authenticated'}</p>
        <p><strong>Student User:</strong> {studentUser ? `${studentUser.email} (${studentUser.role})` : 'None'}</p>
        <button onClick={checkTokens} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
          Check Tokens in Console
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={testAdminAPI} 
          disabled={loading}
          style={{ padding: '0.75rem 1.5rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Test Admin API
        </button>
        <button 
          onClick={testStudentAPI} 
          disabled={loading}
          style={{ padding: '0.75rem 1.5rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Test Student API
        </button>
        <button 
          onClick={testDirectAPI} 
          disabled={loading}
          style={{ padding: '0.75rem 1.5rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Test Direct API
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <h3>Admin API Results</h3>
          <pre style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px', overflow: 'auto', maxHeight: '400px' }}>
            {adminResults ? JSON.stringify(adminResults, null, 2) : 'No results yet'}
          </pre>
        </div>
        
        <div>
          <h3>Student API Results</h3>
          <pre style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px', overflow: 'auto', maxHeight: '400px' }}>
            {studentResults ? JSON.stringify(studentResults, null, 2) : 'No results yet'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;
