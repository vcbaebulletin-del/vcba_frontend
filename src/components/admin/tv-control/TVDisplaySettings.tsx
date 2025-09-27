import React, { useState } from 'react';
import { tvControlService, TVDisplaySettings as TVSettings } from '../../../services/tvControlService';
import { Save, RotateCcw } from 'lucide-react';

interface TVDisplaySettingsProps {
  settings: TVSettings;
}

const TVDisplaySettings: React.FC<TVDisplaySettingsProps> = ({ settings }) => {
  const [localSettings, setLocalSettings] = useState<TVSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (key: keyof TVSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(settings));
  };

  const handleSave = () => {
    tvControlService.updateSettings(localSettings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: '#2c3e50'
  };

  const sectionStyle = {
    marginBottom: '2rem',
    padding: '1.5rem',
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        {hasChanges && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleReset}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <RotateCcw size={16} />
              Reset
            </button>
            <button
              onClick={handleSave}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Slide Interval Setting */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 1.5rem 0', color: '#2c3e50' }}>Slide Interval Setting</h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '400px'
        }}>
          <div>
            <label style={labelStyle}>
              Slide Interval (seconds)
            </label>
            <input
              type="number"
              min="5"
              max="300"
              step="1"
              value={localSettings.slideInterval / 1000}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 5 && value <= 300) {
                  handleSettingChange('slideInterval', value * 1000);
                }
              }}
              style={{
                ...inputStyle,
                fontSize: '1.1rem',
                padding: '1rem'
              }}
              placeholder="Enter seconds (5-300)"
            />
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              color: '#6c757d'
            }}>
              Controls how long each slide is displayed. Recommended: 10-20 seconds.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVDisplaySettings;
