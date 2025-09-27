import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Settings, AlertTriangle, CheckCircle, Phone, Globe, Key, BarChart3, History, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { usePermissions } from '../../utils/permissions';
import { smsService, SMSConfig, SMSTestRequest, SMSStatusResponse, SMSStatistics } from '../../services/smsService';

interface LocalSMSConfig {
  apiKey: string;
  deviceId: string;
  baseURL: string;
  isEnabled: boolean;
  rateLimitPerMinute: number;
}

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  category: 'announcement' | 'emergency' | 'reminder' | 'general';
}

const SMSSettings: React.FC = () => {
  const { user } = useAdminAuth();
  const permissions = usePermissions(user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'templates' | 'test' | 'statistics'>('config');
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // SMS Configuration State
  const [smsConfig, setSmsConfig] = useState<LocalSMSConfig>({
    apiKey: '8b8f9e20-0f2b-4949-b8a6-877f56e0b399', // Default value
    deviceId: '68c85987c27bd0d0b9608142', // Default value
    baseURL: 'https://api.textbee.dev/api/v1',
    isEnabled: true,
    rateLimitPerMinute: 60
  });

  // Password visibility state
  const [showApiKey, setShowApiKey] = useState(false);
  const [showDeviceId, setShowDeviceId] = useState(false);

  // SMS Statistics State
  const [statistics, setStatistics] = useState<SMSStatistics>({
    total: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    pending: 0
  });

  // SMS Templates State
  const [templates, setTemplates] = useState<SMSTemplate[]>([
    {
      id: '1',
      name: 'Class Cancellation',
      content: 'NOTICE: Your {subject} class scheduled for {time} on {date} has been cancelled. Please check the bulletin board for updates.',
      category: 'announcement'
    },
    {
      id: '2',
      name: 'Emergency Alert',
      content: 'EMERGENCY: {message}. Please follow safety protocols and await further instructions.',
      category: 'emergency'
    },
    {
      id: '3',
      name: 'Event Reminder',
      content: 'REMINDER: {event_name} is scheduled for {date} at {time}. Location: {venue}. Don\'t miss it!',
      category: 'reminder'
    }
  ]);

  // Test SMS State
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('This is a test message from VCBA E-Bulletin Board system.');
  const [testSending, setTestSending] = useState(false);

  useEffect(() => {
    // Check if user has permission to manage SMS settings
    if (!permissions.canManageSMSSettings) {
      setError('You do not have permission to manage SMS settings');
      setLoading(false);
      return;
    }

    loadSMSSettings();
  }, [permissions.canManageSMSSettings]);

  const loadSMSSettings = async (isRetryAttempt = false) => {
    try {
      setLoading(true);
      setError(null);
      if (isRetryAttempt) {
        setIsRetrying(true);
      }

      console.log('🔄 Loading SMS settings...');

      // First check if SMS service is available
      try {
        await smsService.checkHealth();
        console.log('✅ SMS service is available');
      } catch (healthError: any) {
        console.error('❌ SMS service health check failed:', healthError);
        throw new Error('SMS service is not available. Please ensure the backend server is running.');
      }

      // Load full SMS configuration for editing (unmasked values)
      const config = await smsService.getFullConfig();
      console.log('✅ Full SMS config loaded:', {
        ...config,
        apiKey: config.apiKey ? `${config.apiKey.substring(0, 8)}...` : 'Not set',
        deviceId: config.deviceId ? `${config.deviceId.substring(0, 8)}...` : 'Not set'
      });

      setSmsConfig({
        apiKey: config.apiKey || '8b8f9e20-0f2b-4949-b8a6-877f56e0b399',
        deviceId: config.deviceId || '68c85987c27bd0d0b9608142',
        baseURL: config.baseURL || 'https://api.textbee.dev/api/v1',
        isEnabled: config.enabled !== undefined ? config.enabled : true,
        rateLimitPerMinute: config.rateLimitPerMinute || 60
      });

      // Load SMS statistics
      try {
        const stats = await smsService.getStatistics();
        console.log('✅ SMS statistics loaded:', stats);
        setStatistics(stats);
      } catch (statsError: any) {
        console.warn('⚠️ Failed to load SMS statistics, using defaults:', statsError.message);
        // Don't fail the entire load if just statistics fail
        setStatistics({
          total: 0,
          sent: 0,
          delivered: 0,
          failed: 0,
          pending: 0
        });
      }

      // Reset retry count on success
      setRetryCount(0);
      console.log('✅ SMS settings loaded successfully');

    } catch (err: any) {
      console.error('❌ Error loading SMS settings:', err);

      const errorMessage = err.message || 'Unknown error occurred';
      let userFriendlyMessage = '';

      // Provide user-friendly error messages
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        userFriendlyMessage = 'SMS service is not available. The backend server may not be running or SMS routes are not configured.';
      } else if (errorMessage.includes('connect') || errorMessage.includes('network')) {
        userFriendlyMessage = 'Cannot connect to the server. Please check your internet connection and ensure the backend server is running.';
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        userFriendlyMessage = 'You are not authorized to access SMS settings. Please log in again.';
      } else if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
        userFriendlyMessage = 'You do not have permission to access SMS settings. Please contact an administrator.';
      } else {
        userFriendlyMessage = `Failed to load SMS settings: ${errorMessage}`;
      }

      setError(userFriendlyMessage);

      // Auto-retry logic (max 3 attempts)
      if (!isRetryAttempt && retryCount < 2) {
        console.log(`🔄 Auto-retrying in 3 seconds... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadSMSSettings(true);
        }, 3000);
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate configuration
      const errors = [];
      if (!smsConfig.apiKey.trim()) {
        errors.push('API Key is required');
      }
      if (!smsConfig.deviceId.trim()) {
        errors.push('Device ID is required');
      }
      if (!smsConfig.baseURL.trim()) {
        errors.push('Base URL is required');
      } else {
        try {
          new URL(smsConfig.baseURL);
        } catch {
          errors.push('Base URL must be a valid URL');
        }
      }
      if (smsConfig.rateLimitPerMinute < 1 || smsConfig.rateLimitPerMinute > 1000) {
        errors.push('Rate limit must be between 1 and 1000');
      }

      if (errors.length > 0) {
        setError('Please fix the following errors:\n• ' + errors.join('\n• '));
        return;
      }

      // Validate and sanitize configuration before sending
      const sanitizedConfig = {
        apiKey: smsConfig.apiKey,
        deviceId: smsConfig.deviceId,
        baseURL: smsConfig.baseURL,
        isEnabled: Boolean(smsConfig.isEnabled), // Ensure it's always a boolean
        rateLimitPerMinute: Number(smsConfig.rateLimitPerMinute) || 60
      };

      console.log('💾 Saving SMS configuration:', sanitizedConfig);
      console.log('🔍 Data types:', {
        apiKey: typeof sanitizedConfig.apiKey,
        deviceId: typeof sanitizedConfig.deviceId,
        baseURL: typeof sanitizedConfig.baseURL,
        isEnabled: typeof sanitizedConfig.isEnabled,
        rateLimitPerMinute: typeof sanitizedConfig.rateLimitPerMinute
      });

      // Update SMS configuration
      await smsService.updateConfig(sanitizedConfig);

      setSuccess('SMS settings saved successfully! Configuration has been updated.');
      setTimeout(() => setSuccess(null), 5000);

      // Reload settings to get updated status
      await loadSMSSettings();

    } catch (err: any) {
      console.error('❌ Error saving SMS settings:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      setError(`Failed to save SMS settings: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMS = async () => {
    if (!testPhone.trim() || !testMessage.trim()) {
      setError('Please enter both phone number and message');
      return;
    }

    // Validate phone number format
    if (!smsService.validatePhoneNumber(testPhone)) {
      setError('Invalid phone number format. Please use Philippine mobile number format (09XXXXXXXXX or +639XXXXXXXXX)');
      return;
    }

    try {
      setTestSending(true);
      setError(null);
      setSuccess(null);

      // Send test SMS
      const result = await smsService.sendTestMessage({
        phoneNumber: testPhone,
        message: testMessage
      });

      if (result.success) {
        setSuccess(`Test SMS sent successfully to ${smsService.formatPhoneNumber(testPhone)}!`);
        // Reload statistics to show updated counts
        const stats = await smsService.getStatistics();
        setStatistics(stats);
      } else {
        setError(`Failed to send test SMS: ${result.message}`);
      }

      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);

    } catch (err: any) {
      setError('Failed to send test SMS: ' + (err.message || 'Unknown error'));
      console.error('Error sending test SMS:', err);
    } finally {
      setTestSending(false);
    }
  };

  // Permission check
  if (!permissions.canManageSMSSettings) {
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
        <MessageSquare size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
          Access Denied
        </h2>
        <p style={{ margin: 0, fontSize: '1rem' }}>
          You do not have permission to manage SMS settings.
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

  const tabs = [
    { key: 'config', label: 'Configuration', icon: Settings },
    // { key: 'templates', label: 'Templates', icon: MessageSquare },
    { key: 'test', label: 'Test SMS', icon: Send }
    // { key: 'statistics', label: 'Statistics', icon: BarChart3 }
  ];

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            {/* Connection Status Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '600',
              background: error ? '#fef2f2' : loading ? '#fef3c7' : '#f0fdf4',
              color: error ? '#dc2626' : loading ? '#d97706' : '#059669',
              border: `1px solid ${error ? '#fecaca' : loading ? '#fed7aa' : '#bbf7d0'}`
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: error ? '#dc2626' : loading ? '#d97706' : '#059669'
              }} />
              {error ? 'Disconnected' : loading ? 'Connecting...' : 'Connected'}
            </div>
          </div>

        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          background: smsConfig.isEnabled ? '#dcfce7' : '#fef2f2',
          color: smsConfig.isEnabled ? '#166534' : '#dc2626',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          <Phone size={16} />
          SMS {smsConfig.isEnabled ? 'Enabled' : 'Disabled'}
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
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            <AlertTriangle size={16} style={{ marginTop: '0.125rem', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                SMS Settings Error
              </div>
              <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                {error}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            fontSize: '0.875rem'
          }}>
            <button
              onClick={() => loadSMSSettings()}
              disabled={loading || isRetrying}
              style={{
                padding: '0.5rem 1rem',
                background: loading || isRetrying ? '#9ca3af' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: loading || isRetrying ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading || isRetrying ? 'Retrying...' : 'Retry'}
            </button>

            {retryCount > 0 && (
              <span style={{ color: '#6b7280' }}>
                Retry attempt: {retryCount}/3
              </span>
            )}

            {isRetrying && (
              <span style={{ color: '#6b7280' }}>
                Auto-retrying in a moment...
              </span>
            )}
          </div>
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
      {activeTab === 'config' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '2rem'
        }}>
          <h3 style={{
            margin: '0 0 1.5rem',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            SMS Configuration
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                <Key size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                API Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showApiKey ? "text" : "password"}
                  value={smsConfig.apiKey}
                  onChange={(e) => setSmsConfig({ ...smsConfig, apiKey: e.target.value })}
                  placeholder="Enter your SMS API key"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    paddingRight: '3rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '0.25rem'
                  }}
                  title={showApiKey ? "Hide API Key" : "Show API Key"}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                <Phone size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Device ID
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showDeviceId ? "text" : "password"}
                  value={smsConfig.deviceId}
                  onChange={(e) => setSmsConfig({ ...smsConfig, deviceId: e.target.value })}
                  placeholder="Enter your TextBee device ID"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    paddingRight: '3rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowDeviceId(!showDeviceId)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '0.25rem'
                  }}
                  title={showDeviceId ? "Hide Device ID" : "Show Device ID"}
                >
                  {showDeviceId ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                <Globe size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Base URL
              </label>
              <input
                type="url"
                value={smsConfig.baseURL}
                onChange={(e) => setSmsConfig({ ...smsConfig, baseURL: e.target.value })}
                placeholder="https://api.textbee.dev/api/v1"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                margin: '0.25rem 0 0 0'
              }}>
                TextBee API base URL (usually https://api.textbee.dev/api/v1)
              </p>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Rate Limit (per minute)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={smsConfig.rateLimitPerMinute}
                onChange={(e) => setSmsConfig({ ...smsConfig, rateLimitPerMinute: parseInt(e.target.value) || 60 })}
                placeholder="60"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                margin: '0.25rem 0 0 0'
              }}>
                Maximum SMS messages to send per minute
              </p>
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                <input
                  type="checkbox"
                  checked={smsConfig.isEnabled}
                  onChange={(e) => setSmsConfig({ ...smsConfig, isEnabled: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Enable SMS Notifications
              </label>
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                margin: 0
              }}>
                Allow the system to send SMS notifications to students and staff
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              style={{
                padding: '0.75rem 1.5rem',
                background: saving ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Settings size={16} />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'test' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '2rem'
        }}>
          <h3 style={{
            margin: '0 0 1.5rem',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Test SMS Functionality
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                onInput={(e) => {
                  // Allow only numbers and limit to 11 digits
                  e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 11);
                }}
                placeholder="09XXXXXXXXX"
                maxLength={11}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Test Message
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter your test message here..."
                rows={4}
                maxLength={160}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                textAlign: 'right',
                marginTop: '0.25rem'
              }}>
                {testMessage.length}/160 characters
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={handleTestSMS}
              disabled={testSending || !testPhone.trim() || !testMessage.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                background: testSending ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: testSending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Send size={16} />
              {testSending ? 'Sending...' : 'Send Test SMS'}
            </button>
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '2rem'
        }}>
          <h3 style={{
            margin: '0 0 1.5rem',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            SMS Statistics
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <BarChart3 size={20} style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>Total</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b' }}>
                {statistics.total.toLocaleString()}
              </div>
            </div>

            <div style={{
              background: '#f0fdf4',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <CheckCircle size={20} style={{ color: '#10b981' }} />
                <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '600' }}>Sent</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#065f46' }}>
                {statistics.sent.toLocaleString()}
              </div>
            </div>

            <div style={{
              background: '#fef3f2',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #fecaca'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                <span style={{ fontSize: '0.875rem', color: '#dc2626', fontWeight: '600' }}>Failed</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#991b1b' }}>
                {statistics.failed.toLocaleString()}
              </div>
            </div>

            <div style={{
              background: '#fffbeb',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #fed7aa'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <History size={20} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '0.875rem', color: '#d97706', fontWeight: '600' }}>Pending</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#92400e' }}>
                {statistics.pending.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                Success Rate
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                {statistics.total > 0 ? Math.round((statistics.sent / statistics.total) * 100) : 0}%
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                Last Updated
              </div>
              <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              onClick={() => loadSMSSettings()}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '0 auto'
              }}
            >
              <BarChart3 size={16} />
              {loading ? 'Refreshing...' : 'Refresh Statistics'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSSettings;
