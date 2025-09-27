import { useState, useCallback } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
}

interface RetryState {
  isRetrying: boolean;
  attempts: number;
  lastError: Error | null;
}

export const useRetry = (options: RetryOptions = {}) => {
  const { maxAttempts = 3, delay = 1000, backoff = true } = options;
  
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    attempts: 0,
    lastError: null,
  });

  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    customOptions?: Partial<RetryOptions>
  ): Promise<T> => {
    const finalOptions = { ...options, ...customOptions };
    const finalMaxAttempts = finalOptions.maxAttempts || maxAttempts;
    const finalDelay = finalOptions.delay || delay;
    const finalBackoff = finalOptions.backoff !== undefined ? finalOptions.backoff : backoff;

    setRetryState({
      isRetrying: true,
      attempts: 0,
      lastError: null,
    });

    for (let attempt = 1; attempt <= finalMaxAttempts; attempt++) {
      try {
        setRetryState(prev => ({ ...prev, attempts: attempt }));
        
        const result = await operation();
        
        setRetryState({
          isRetrying: false,
          attempts: attempt,
          lastError: null,
        });
        
        return result;
      } catch (error) {
        const isLastAttempt = attempt === finalMaxAttempts;
        
        setRetryState(prev => ({
          ...prev,
          lastError: error as Error,
          isRetrying: !isLastAttempt,
        }));

        if (isLastAttempt) {
          throw error;
        }

        // Wait before retrying (with exponential backoff if enabled)
        const waitTime = finalBackoff ? finalDelay * Math.pow(2, attempt - 1) : finalDelay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error('Retry operation failed');
  }, [maxAttempts, delay, backoff]);

  const reset = useCallback(() => {
    setRetryState({
      isRetrying: false,
      attempts: 0,
      lastError: null,
    });
  }, []);

  return {
    retry,
    reset,
    ...retryState,
  };
};

export default useRetry;
