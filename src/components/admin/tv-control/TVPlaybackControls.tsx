import React from 'react';
import { tvControlService, TVDisplaySettings, TVDisplayStatus } from '../../../services/tvControlService';
import { tvContentSelectionService } from '../../../services/tvContentSelectionService';
import { Play, Pause, SkipForward, SkipBack, Square } from 'lucide-react';

interface TVPlaybackControlsProps {
  settings: TVDisplaySettings;
  status: TVDisplayStatus;
}

const TVPlaybackControls: React.FC<TVPlaybackControlsProps> = ({ settings, status }) => {

  const handlePlay = () => {
    // Only allow play if content is selected
    if (tvContentSelectionService.hasSelectedContent()) {
      tvControlService.play();
    }
  };

  const handlePause = () => {
    tvControlService.pause();
  };

  const handleNext = () => {
    tvControlService.next();
  };

  const handlePrevious = () => {
    tvControlService.previous();
  };

  const handleStop = () => {
    tvControlService.pause();
    // Reset to first slide
    tvControlService.sendCommand({ action: 'refresh', timestamp: Date.now().toString() });
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const controlButtonStyle = {
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)'
  };



  const hasSelectedContent = tvContentSelectionService.hasSelectedContent();
  const selectedCount = tvContentSelectionService.getSelectedCount();

  return (
    <div>
      {/* Content Selection Status - Removed redundant controls */}

      {/* Content Selection Status */}
      <div style={{
        background: hasSelectedContent ? '#d4edda' : '#f8d7da',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: `1px solid ${hasSelectedContent ? '#c3e6cb' : '#f5c6cb'}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h4 style={{
              margin: '0 0 0.5rem 0',
              color: hasSelectedContent ? '#155724' : '#721c24',
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              Content Selection Status
            </h4>
            <div style={{
              fontSize: '0.9rem',
              color: hasSelectedContent ? '#155724' : '#721c24',
              opacity: 0.8
            }}>
              {hasSelectedContent
                ? `${selectedCount.total} items selected (${selectedCount.announcements} announcements posts, ${selectedCount.calendarEvents} school posts)`
                : 'No content selected - TV will show blank screen'
              }
            </div>
          </div>

          {/* {!hasSelectedContent && (
            <div style={{
              background: '#dc3545',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}>
              ⚠️ SELECT CONTENT TO ENABLE TV
            </div>
          )} */}
        </div>
      </div>

      {/* Current Status Display */}
      <div style={{
        background: '#f8f9fa',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        border: '1px solid #e9ecef'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem'
        }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
              Current Status
            </h4>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: status.isPlaying ? '#28a745' : '#dc3545'
            }}>
              {status.isPlaying ? '▶️ Playing' : '⏸️ Paused'}
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
              Slide Duration
            </h4>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2c3e50' }}>
              {formatTime(settings.slideInterval)}
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
              Selected Content
            </h4>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2c3e50' }}>
              {selectedCount.total} items
            </div>
          </div>

        </div>
      </div>

      {/* Main Control Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={!hasSelectedContent}
          style={{
            ...controlButtonStyle,
            background: !hasSelectedContent ? '#bdc3c7' : '#3498db',
            cursor: !hasSelectedContent ? 'not-allowed' : 'pointer',
            opacity: !hasSelectedContent ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (hasSelectedContent) {
              e.currentTarget.style.background = '#2980b9';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (hasSelectedContent) {
              e.currentTarget.style.background = '#3498db';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          title={!hasSelectedContent ? 'Select content first' : 'Previous Slide'}
        >
          <SkipBack size={24} />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={status.isPlaying ? handlePause : handlePlay}
          disabled={!hasSelectedContent}
          style={{
            ...controlButtonStyle,
            width: '80px',
            height: '80px',
            background: !hasSelectedContent
              ? '#bdc3c7'
              : (status.isPlaying ? '#e74c3c' : '#27ae60'),
            cursor: !hasSelectedContent ? 'not-allowed' : 'pointer',
            opacity: !hasSelectedContent ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (hasSelectedContent) {
              e.currentTarget.style.background = status.isPlaying ? '#c0392b' : '#229954';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (hasSelectedContent) {
              e.currentTarget.style.background = status.isPlaying ? '#e74c3c' : '#27ae60';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          title={!hasSelectedContent
            ? 'Select content first'
            : (status.isPlaying ? 'Pause' : 'Play')
          }
        >
          {status.isPlaying ? <Pause size={32} /> : <Play size={32} />}
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={!hasSelectedContent}
          style={{
            ...controlButtonStyle,
            background: !hasSelectedContent ? '#bdc3c7' : '#3498db',
            cursor: !hasSelectedContent ? 'not-allowed' : 'pointer',
            opacity: !hasSelectedContent ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (hasSelectedContent) {
              e.currentTarget.style.background = '#2980b9';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (hasSelectedContent) {
              e.currentTarget.style.background = '#3498db';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          title={!hasSelectedContent ? 'Select content first' : 'Next Slide'}
        >
          <SkipForward size={24} />
        </button>

        {/* Stop Button */}
        <button
          onClick={handleStop}
          disabled={!hasSelectedContent}
          style={{
            ...controlButtonStyle,
            background: !hasSelectedContent ? '#bdc3c7' : '#e74c3c',
            cursor: !hasSelectedContent ? 'not-allowed' : 'pointer',
            opacity: !hasSelectedContent ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (hasSelectedContent) {
              e.currentTarget.style.background = '#c0392b';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (hasSelectedContent) {
              e.currentTarget.style.background = '#e74c3c';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          title={!hasSelectedContent ? 'Select content first' : 'Stop and Reset'}
        >
          <Square size={24} />
        </button>
      </div>

      {/* Removed Open TV Display section - redundant functionality */}

      {/* Content selection functionality moved to TVContentManager.tsx */}

    </div>
  );
};

export default TVPlaybackControls;