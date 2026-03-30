import React, { createContext, useContext, ReactNode } from 'react';
import { useBackendConnection, BackendConnectionState } from '../hooks/useBackendConnection';

const BackendConnectionContext = createContext<BackendConnectionState | null>(null);

interface BackendConnectionProviderProps {
  children: ReactNode;
}

/**
 * Provider that creates a single backend connection instance for the entire app.
 * This prevents multiple competing connection loops/timers when hooks mount across the tree.
 */
export function BackendConnectionProvider({ children }: BackendConnectionProviderProps) {
  const connection = useBackendConnection();

  return (
    <BackendConnectionContext.Provider value={connection}>
      {children}
    </BackendConnectionContext.Provider>
  );
}

/**
 * Hook to access the singleton backend connection state.
 * Must be used within BackendConnectionProvider.
 */
export function useBackendConnectionContext(): BackendConnectionState {
  const context = useContext(BackendConnectionContext);
  
  if (!context) {
    throw new Error(
      'useBackendConnectionContext must be used within BackendConnectionProvider. ' +
      'Wrap your app with <BackendConnectionProvider> to use backend connection hooks.'
    );
  }
  
  return context;
}
