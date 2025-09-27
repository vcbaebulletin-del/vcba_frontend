import React, { useState, useEffect } from 'react';
import { TVDisplayStatus, TVDisplaySettings } from '../../../services/tvControlService';
import { Wifi, WifiOff, Clock, BarChart3, ExternalLink } from 'lucide-react';

interface TVStatusMonitorProps {
  status: TVDisplayStatus;
  settings: TVDisplaySettings;
}

const TVStatusMonitor: React.FC<TVStatusMonitorProps> = ({ status }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const openTVDisplay = () => {
    window.open('/tv-display', '_blank', 'fullscreen=yes');
  };

  const statusCardStyle = {
    background: 'white',
    border: '1px solid #e9ecef',
    borderRadius: '12px',
    padding: '1.5rem',
    textAlign: 'center' as const
  };

  return (
    <div>
      {/* Status Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Connection Status */}
        <div style={{
          ...statusCardStyle,
          borderColor: status.isOnline ? '#28a745' : '#dc3545',
          borderWidth: '2px'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>
            {status.isOnline ? <Wifi size={48} color="#28a745" /> : <WifiOff size={48} color="#dc3545" />}
          </div>
          <h3 style={{
            margin: '0 0 0.5rem 0',
            color: status.isOnline ? '#28a745' : '#dc3545',
            fontSize: '1.2rem'
          }}>
            {status.isOnline ? 'Online' : 'Offline'}
          </h3>
          <p style={{
            margin: 0,
            color: '#6c757d',
            fontSize: '0.9rem'
          }}>
            TV Display Status
          </p>
        </div>

        {/* Playback Status */}
        <div style={statusCardStyle}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            color: status.isPlaying ? '#28a745' : '#ffc107'
          }}>
            {status.isPlaying ? '▶️' : '⏸️'}
          </div>
          <h3 style={{
            margin: '0 0 0.5rem 0',
            color: '#2c3e50',
            fontSize: '1.2rem'
          }}>
            {status.isPlaying ? 'Playing' : 'Paused'}
          </h3>
          <p style={{
            margin: 0,
            color: '#6c757d',
            fontSize: '0.9rem'
          }}>
            Slideshow Status
          </p>
        </div>


      </div>



      {/* Real-time Clock */}
      <div style={{
        background: '#2c3e50',
        color: 'white',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <Clock size={24} />
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Current Time</h3>
        </div>
        <div style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          fontFamily: 'monospace'
        }}>
          {currentTime.toLocaleTimeString()}
        </div>
        <div style={{
          fontSize: '1.2rem',
          opacity: 0.8,
          marginTop: '0.5rem'
        }}>
          {currentTime.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>
    </div>
  );
};

export default TVStatusMonitor;
