// TV Display Control Service
// Manages TV display state, settings, and remote control functionality

export interface TVDisplaySettings {
  isEnabled: boolean;
  autoPlay: boolean;
  slideInterval: number; // in milliseconds
  showAnnouncements: boolean;
  showCalendarEvents: boolean;
  maxAnnouncements: number;
  maxEvents: number;
  announcementCategories: number[]; // category IDs to include
  eventCategories: number[]; // category IDs to include
  displayDuration: number; // how long to show each slide
  transitionType: 'fade' | 'slide' | 'none';
  emergencyMessage?: string;
  emergencyActive: boolean;
  lastUpdated: string;
}

export interface TVDisplayStatus {
  isOnline: boolean;
  currentSlide: number;
  totalSlides: number;
  isPlaying: boolean;
  lastRefresh: string;
  connectedDevices: number;
  uptime: string;
}

export interface TVControlCommand {
  action: 'play' | 'pause' | 'next' | 'previous' | 'refresh' | 'emergency' | 'settings';
  payload?: any;
  timestamp: string;
}

class TVControlService {
  private settings: TVDisplaySettings;
  private status: TVDisplayStatus;
  private listeners: ((settings: TVDisplaySettings) => void)[] = [];
  private statusListeners: ((status: TVDisplayStatus) => void)[] = [];

  constructor() {
    // Initialize with default settings
    this.settings = {
      isEnabled: true,
      autoPlay: true,
      slideInterval: 15000, // 15 seconds
      showAnnouncements: true,
      showCalendarEvents: true,
      maxAnnouncements: 10,
      maxEvents: 5,
      announcementCategories: [],
      eventCategories: [],
      displayDuration: 15000,
      transitionType: 'slide',
      emergencyMessage: '',
      emergencyActive: false,
      lastUpdated: new Date().toISOString()
    };

    this.status = {
      isOnline: false,
      currentSlide: 0,
      totalSlides: 0,
      isPlaying: true,
      lastRefresh: new Date().toISOString(),
      connectedDevices: 0,
      uptime: '0m'
    };

    this.loadSettings();
    this.initializeStatusMonitoring();
  }

  // Settings Management
  getSettings(): TVDisplaySettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<TVDisplaySettings>): void {
    this.settings = {
      ...this.settings,
      ...newSettings,
      lastUpdated: new Date().toISOString()
    };
    this.saveSettings();
    this.notifyListeners();
    this.broadcastToDisplays();
  }

  // Status Management
  getStatus(): TVDisplayStatus {
    return { ...this.status };
  }

  updateStatus(newStatus: Partial<TVDisplayStatus>): void {
    this.status = {
      ...this.status,
      ...newStatus
    };
    this.notifyStatusListeners();
  }

  // Control Commands
  sendCommand(command: TVControlCommand): void {
    const commandWithTimestamp = {
      ...command,
      timestamp: new Date().toISOString()
    };

    // Store command in localStorage for TV display to pick up
    const commands = this.getStoredCommands();
    commands.push(commandWithTimestamp);
    localStorage.setItem('tv_control_commands', JSON.stringify(commands));

    // Update local status based on command
    this.handleCommandLocally(commandWithTimestamp);
  }

  // Playback Controls
  play(): void {
    this.sendCommand({ action: 'play', timestamp: new Date().toISOString() });
    this.updateStatus({ isPlaying: true });
  }

  pause(): void {
    this.sendCommand({ action: 'pause', timestamp: new Date().toISOString() });
    this.updateStatus({ isPlaying: false });
  }

  next(): void {
    this.sendCommand({ action: 'next', timestamp: new Date().toISOString() });
  }

  previous(): void {
    this.sendCommand({ action: 'previous', timestamp: new Date().toISOString() });
  }

  refresh(): void {
    this.sendCommand({ action: 'refresh', timestamp: new Date().toISOString() });
    this.updateStatus({ lastRefresh: new Date().toISOString() });
  }

  // Emergency Broadcasting
  broadcastEmergency(message: string): void {
    console.log('Broadcasting emergency:', message);

    this.updateSettings({
      emergencyMessage: message,
      emergencyActive: true
    });

    this.sendCommand({
      action: 'emergency',
      payload: { message },
      timestamp: new Date().toISOString()
    });

    // Multiple signals for immediate update
    const timestamp = Date.now().toString();
    localStorage.setItem('tv_emergency_broadcast', timestamp);
    localStorage.setItem('tv_emergency_active', 'true');
    localStorage.setItem('tv_emergency_message', message);

    // Force storage event dispatch
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'tv_emergency_broadcast',
      newValue: timestamp,
      oldValue: null
    }));

    // Additional signal
    window.dispatchEvent(new CustomEvent('emergency-broadcast', {
      detail: { message, active: true }
    }));

    console.log('Emergency broadcast signals sent');
  }

  clearEmergency(): void {
    console.log('Clearing emergency');

    this.updateSettings({
      emergencyMessage: '',
      emergencyActive: false
    });

    // Clear emergency signals
    localStorage.removeItem('tv_emergency_broadcast');
    localStorage.setItem('tv_emergency_active', 'false');
    localStorage.removeItem('tv_emergency_message');

    // Dispatch clear event
    window.dispatchEvent(new CustomEvent('emergency-cleared'));

    console.log('Emergency cleared');
  }

  // Command Management
  getStoredCommands(): TVControlCommand[] {
    try {
      const commands = localStorage.getItem('tv_control_commands');
      return commands ? JSON.parse(commands) : [];
    } catch {
      return [];
    }
  }

  clearProcessedCommands(): void {
    localStorage.removeItem('tv_control_commands');
  }

  // Event Listeners
  onSettingsChange(callback: (settings: TVDisplaySettings) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  onStatusChange(callback: (status: TVDisplayStatus) => void): () => void {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== callback);
    };
  }

  // Private Methods
  private loadSettings(): void {
    try {
      const stored = localStorage.getItem('tv_display_settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load TV display settings:', error);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('tv_display_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save TV display settings:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.settings));
  }

  private notifyStatusListeners(): void {
    this.statusListeners.forEach(callback => callback(this.status));
  }

  private broadcastToDisplays(): void {
    // Broadcast settings change to all connected displays
    localStorage.setItem('tv_display_settings_updated', Date.now().toString());
  }

  private handleCommandLocally(command: TVControlCommand): void {
    switch (command.action) {
      case 'play':
        this.updateStatus({ isPlaying: true });
        break;
      case 'pause':
        this.updateStatus({ isPlaying: false });
        break;
      case 'refresh':
        this.updateStatus({ lastRefresh: new Date().toISOString() });
        break;
    }
  }

  private initializeStatusMonitoring(): void {
    // Check TV display status periodically
    setInterval(() => {
      this.checkDisplayStatus();
    }, 5000); // Check every 5 seconds
  }

  private checkDisplayStatus(): void {
    // Check if TV display is responding
    const lastHeartbeat = localStorage.getItem('tv_display_heartbeat');
    const isOnline = lastHeartbeat && 
      (Date.now() - parseInt(lastHeartbeat)) < 30000; // 30 seconds timeout

    this.updateStatus({
      isOnline: !!isOnline,
      connectedDevices: isOnline ? 1 : 0
    });
  }
}

// Export singleton instance
export const tvControlService = new TVControlService();
