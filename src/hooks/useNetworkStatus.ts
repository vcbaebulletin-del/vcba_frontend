import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: null,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      const isSlowConnection = connection ? 
        (connection.effectiveType === 'slow-2g' || 
         connection.effectiveType === '2g' ||
         connection.downlink < 1.5) : false;

      setNetworkStatus({
        isOnline: navigator.onLine,
        isSlowConnection,
        connectionType: connection?.effectiveType || null,
      });
    };

    const handleOnline = () => {
      updateNetworkStatus();
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
      }));
    };

    const handleConnectionChange = () => {
      updateNetworkStatus();
    };

    // Initial check
    updateNetworkStatus();

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes if supported
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkStatus;
};

export default useNetworkStatus;
