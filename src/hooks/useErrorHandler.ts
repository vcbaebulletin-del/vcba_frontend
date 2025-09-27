import { useState, useCallback } from 'react';
import { ErrorHandler, ErrorDisplayInfo } from '../utils/errorHandler';

export interface UseErrorHandlerReturn {
  error: ErrorDisplayInfo | null;
  setError: (error: any, context?: string) => void;
  clearError: () => void;
  hasError: boolean;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setErrorState] = useState<ErrorDisplayInfo | null>(null);

  const setError = useCallback((error: any, context?: string) => {
    if (error) {
      const errorInfo = ErrorHandler.getDisplayInfo(error);
      ErrorHandler.logError(error, context);
      setErrorState(errorInfo);
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  return {
    error,
    setError,
    clearError,
    hasError: error !== null
  };
};

// Hook for API calls with automatic error handling
export const useApiCall = <T = any>() => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const { error, setError, clearError } = useErrorHandler();

  const execute = useCallback(async (
    apiCall: () => Promise<T>,
    context?: string
  ) => {
    setLoading(true);
    clearError();
    
    try {
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      setError(err, context);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setError, clearError]);

  const reset = useCallback(() => {
    setData(null);
    clearError();
    setLoading(false);
  }, [clearError]);

  return {
    loading,
    data,
    error,
    execute,
    reset,
    hasError: error !== null
  };
};
