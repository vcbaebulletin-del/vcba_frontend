import React, { useState, useEffect } from 'react';
import { tvControlService, TVDisplaySettings, TVDisplayStatus } from '../../../services/tvControlService';
import TVPlaybackControls from './TVPlaybackControls';
import TVDisplaySettingsComponent from './TVDisplaySettings';
import TVStatusMonitor from './TVStatusMonitor';
import TVContentManager from './TVContentManager';
import TVEmergencyBroadcast from './TVEmergencyBroadcast';
import { Monitor, Settings, Play, AlertTriangle, BarChart3 } from 'lucide-react';

const TVControlPanel: React.FC = () => {
  const [settings, setSettings] = useState<TVDisplaySettings>(tvControlService.getSettings());
  const [status, setStatus] = useState<TVDisplayStatus>(tvControlService.getStatus());
  const [activeTab, setActiveTab] = useState<'controls' | 'settings' | 'content' | 'emergency'>('controls');

  useEffect(() => {
    // Subscribe to settings changes
    const unsubscribeSettings = tvControlService.onSettingsChange(setSettings);
    const unsubscribeStatus = tvControlService.onStatusChange(setStatus);

    return () => {
      unsubscribeSettings();
      unsubscribeStatus();
    };
  }, []);

  const tabs = [
    { id: 'controls', label: 'Playback', icon: Play, description: 'Control TV display playback' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Configure display settings' },
    { id: 'content', label: 'Content', icon: BarChart3, description: 'Manage displayed content' },
    { id: 'emergency', label: 'Emergency', icon: AlertTriangle, description: 'Emergency broadcasting' },
    // { id: 'monitor', label: 'Monitor', icon: Monitor, description: 'Display status & analytics' }
  ] as const;

  const openTVDisplay = () => {
    window.open('/tv-display', '_blank', 'fullscreen=yes');
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Status Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            background: status.isOnline ? '#d4edda' : '#f8d7da',
            color: status.isOnline ? '#155724' : '#721c24',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: status.isOnline ? '#28a745' : '#dc3545'
            }} />
            {status.isOnline ? 'TV Online' : 'TV Offline'}
          </div>

          {/* Open TV Display Button */}
          <button
            onClick={openTVDisplay}
            style={{
              background: '#3498db',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2980b9'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#3498db'}
          >
            <Monitor size={18} />
            Open TV Display
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        borderBottom: '2px solid #ecf0f1',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem'
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: isActive ? '#3498db' : 'transparent',
                  color: isActive ? 'white' : '#7f8c8d',
                  border: 'none',
                  padding: '1rem 1.5rem',
                  borderRadius: '8px 8px 0 0',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  borderBottom: isActive ? '2px solid #3498db' : '2px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#ecf0f1';
                    e.currentTarget.style.color = '#2c3e50';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#7f8c8d';
                  }
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #ecf0f1'
      }}>
        {activeTab === 'controls' && <TVPlaybackControls settings={settings} status={status} />}
        {activeTab === 'settings' && <TVDisplaySettingsComponent settings={settings} />}
        {activeTab === 'content' && <TVContentManager settings={settings} />}
        {activeTab === 'emergency' && <TVEmergencyBroadcast settings={settings} />}
        {/* {activeTab === 'monitor' && <TVStatusMonitor status={status} settings={settings} />} */}
      </div>
    </div>
  );
};

export default TVControlPanel;
