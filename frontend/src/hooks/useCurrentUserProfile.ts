import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useBackendConnectionSingleton } from './useBackendConnectionSingleton';
import type { UserProfile } from '../backend';
import { UserRole } from '../backend';

const BACKEND_NOT_READY_MESSAGE = 'Backend is not ready yet. Please wait.';

function assertBackendReady(actor: unknown, isReady: boolean): asserts actor is NonNullable<typeof actor> {
  if (!actor || !isReady) {
    throw new Error(BACKEND_NOT_READY_MESSAGE);
  }
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { isReady, isConnecting } = useBackendConnectionSingleton();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');

      // Try to get the profile - if unauthorized, try to assign user role first
      try {
        const profile = await actor.getCallerUserProfile();
        return profile;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);

        // If unauthorized, try to assign user role (for new users)
        if (errMsg.includes('Unauthorized') || errMsg.includes('unauthorized')) {
          try {
            // Try assigning user role to self - this may work if the backend allows it
            // or if the authorization mixin auto-assigns on first access
            await actor.assignCallerUserRole(identity!.getPrincipal(), UserRole.user);
            // Retry getting profile after role assignment
            const profile = await actor.getCallerUserProfile();
            return profile;
          } catch {
            // If role assignment fails, return null to trigger profile setup
            // The backend may handle this differently
            return null;
          }
        }

        throw err;
      }
    },
    enabled: !!actor && !actorFetching && !!identity && !isConnecting && isReady,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || isConnecting || query.isLoading,
    isFetched: !!actor && isReady && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { isReady, isConnecting } = useBackendConnectionSingleton();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      assertBackendReady(actor, isReady && !actorFetching && !isConnecting);

      // Try to save profile; if unauthorized, assign user role first
      try {
        await actor.saveCallerUserProfile(profile);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);

        if (errMsg.includes('Unauthorized') || errMsg.includes('unauthorized')) {
          // Try to assign user role first
          if (identity) {
            try {
              await actor.assignCallerUserRole(identity.getPrincipal(), UserRole.user);
            } catch {
              // Ignore role assignment errors, try saving anyway
            }
          }
          // Retry saving profile
          await actor.saveCallerUserProfile(profile);
        } else {
          throw err;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}
