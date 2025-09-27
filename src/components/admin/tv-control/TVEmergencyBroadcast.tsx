import React, { useState } from 'react';
import { tvControlService, TVDisplaySettings } from '../../../services/tvControlService';
import { AlertTriangle, Send, X, Clock } from 'lucide-react';

interface TVEmergencyBroadcastProps {
  settings: TVDisplaySettings;
}

const TVEmergencyBroadcast: React.FC<TVEmergencyBroadcastProps> = ({ settings }) => {
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleBroadcast = () => {
    if (!emergencyMessage.trim()) return;
    
    tvControlService.broadcastEmergency(emergencyMessage.trim());
    setEmergencyMessage('');
    setIsConfirming(false);
  };

  const handleClearEmergency = () => {
    tvControlService.clearEmergency();
  };

  const quickMessages = [
    "EMERGENCY: Please evacuate the building immediately and proceed to the designated assembly area.",
    "ALERT: Classes are suspended due to severe weather. Please stay indoors until further notice.",
    "FIRE DRILL: This is a scheduled fire drill. Please evacuate calmly using the nearest exit.",
    "WEATHER ALERT: Severe weather warning in effect. Remain in the building until all clear.",
    "ANNOUNCEMENT: Important assembly in the main auditorium at 2:00 PM. All students and staff required.",
    "LOCKDOWN: Security lockdown in effect. Remain in current location and await further instructions."
  ];

  const inputStyle = {
    width: '100%',
    padding: '1rem',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
    resize: 'vertical' as const,
    minHeight: '120px'
  };

  return (
    <div>

      {/* Current Emergency Status */}
      {settings.emergencyActive && (
        <div style={{
          background: '#f8d7da',
          border: '2px solid #f5c6cb',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              margin: 0,
              color: '#721c24',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={20} />
              EMERGENCY BROADCAST ACTIVE
            </h3>
            
            <button
              onClick={handleClearEmergency}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}
            >
              <X size={16} />
              Clear Emergency
            </button>
          </div>
          
          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '6px',
            border: '1px solid #f5c6cb'
          }}>
            <strong>Current Message:</strong>
            <div style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}>
              {settings.emergencyMessage}
            </div>
          </div>
          
          <div style={{
            marginTop: '1rem',
            fontSize: '0.9rem',
            color: '#721c24',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Clock size={16} />
            Active since: {new Date(settings.lastUpdated).toLocaleString()}
          </div>
        </div>
      )}

      {/* Emergency Message Input */}
      <div style={{
        background: '#fff3cd',
        border: '2px solid #ffeaa7',
        borderRadius: '8px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{
          margin: '0 0 1rem 0',
          color: '#856404'
        }}>
          Broadcast Emergency Message
        </h3>
        
        <textarea
          value={emergencyMessage}
          onChange={(e) => setEmergencyMessage(e.target.value)}
          placeholder="Enter emergency message to broadcast to all TV displays..."
          style={{
            ...inputStyle,
            borderColor: emergencyMessage.length > 200 ? '#e74c3c' : '#ddd'
          }}
        />
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1rem'
        }}>
          <div style={{
            fontSize: '0.9rem',
            color: emergencyMessage.length > 200 ? '#e74c3c' : '#6c757d'
          }}>
            {emergencyMessage.length}/200 characters
            {emergencyMessage.length > 200 && ' (Message too long)'}
          </div>
          
          {!isConfirming ? (
            <button
              onClick={() => setIsConfirming(true)}
              disabled={!emergencyMessage.trim() || emergencyMessage.length > 200}
              style={{
                background: emergencyMessage.trim() && emergencyMessage.length <= 200 ? '#dc3545' : '#6c757d',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: emergencyMessage.trim() && emergencyMessage.length <= 200 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              <Send size={16} />
              Broadcast Emergency
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setIsConfirming(false)}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBroadcast}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                CONFIRM BROADCAST
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Message Templates */}
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '2rem'
      }}>
        <h3 style={{
          margin: '0 0 1.5rem 0',
          color: '#2c3e50'
        }}>
          Quick Message Templates
        </h3>
        
        <div style={{
          display: 'grid',
          gap: '1rem'
        }}>
          {quickMessages.map((message, index) => (
            <div
              key={index}
              style={{
                background: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setEmergencyMessage(message)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e3f2fd';
                e.currentTarget.style.borderColor = '#2196f3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#dee2e6';
              }}
            >
              <div style={{
                fontSize: '0.95rem',
                lineHeight: '1.4'
              }}>
                {message}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TVEmergencyBroadcast;
