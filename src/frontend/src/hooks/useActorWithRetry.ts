import { useState } from 'react';
import { useActor } from './useActor';
import { useQuery } from '@tanstack/react-query';

/**
 * Extended version of useActor that adds connection state tracking and retry functionality
 */
export function useActorWithRetry() {
    const [retryTrigger, setRetryTrigger] = useState(0);
    const { actor, isFetching } = useActor();

    // Create a wrapper query to track connection state
    const connectionQuery = useQuery({
        queryKey: ['actor-connection-state', retryTrigger],
        queryFn: async () => {
            if (!actor) {
                throw new Error('Failed to connect to backend. Please check your connection and try again.');
            }
            return true;
        },
        enabled: !isFetching,
        retry: 2,
        retryDelay: 1000,
    });

    const retry = () => {
        setRetryTrigger(prev => prev + 1);
        connectionQuery.refetch();
    };

    const isConnecting = isFetching || connectionQuery.isLoading;
    const isError = connectionQuery.isError && !isFetching;
    const errorMessage = isError 
        ? (connectionQuery.error as Error)?.message || 'Connection failed'
        : null;

    return {
        actor,
        isFetching,
        isConnecting,
        isError,
        error: connectionQuery.error as Error | null,
        errorMessage,
        retry,
    };
}
