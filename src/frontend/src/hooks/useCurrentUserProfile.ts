import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendConnection } from './useBackendConnection';
import { useInternetIdentity } from './useInternetIdentity';
import { UserProfile } from '../backend';
import { assertBackendReady, BACKEND_NOT_READY_MESSAGE } from '../utils/backendNotReadyMessage';

export function useGetCallerUserProfile() {
  const { actor, isReady, isConnecting } = useBackendConnection();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!isReady || !actor) {
        throw new Error(BACKEND_NOT_READY_MESSAGE);
      }
      if (!identity) {
        throw new Error('Not authenticated');
      }
      return actor.getCallerUserProfile();
    },
    enabled: isReady && !!identity && !!actor && !isConnecting,
    retry: false,
  });

  // Return custom state that properly reflects connection dependency
  return {
    ...query,
    isLoading: isConnecting || query.isLoading,
    isFetched: isReady && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor, isReady } = useBackendConnection();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      assertBackendReady(isReady, actor);
      if (!identity) {
        throw new Error('Not authenticated');
      }
      return actor!.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}
