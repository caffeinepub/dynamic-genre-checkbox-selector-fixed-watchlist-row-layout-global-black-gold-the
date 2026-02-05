import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useBackendReadiness } from './useBackendReadiness';
import { MangaEntry } from '../backend';

export function useAddMangaEntry(currentPage: number) {
  const { actor } = useActor();
  const { isActorReady } = useBackendReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, manga }: { id: string; manga: MangaEntry }) => {
      if (!isActorReady || !actor) {
        throw new Error('Backend is not ready. Please wait a moment and try again.');
      }
      return actor.addEntry(id, manga);
    },
    onSuccess: () => {
      // Invalidate all manga page queries to refresh pagination
      queryClient.invalidateQueries({ queryKey: ['mangaPage'] });
      // Also invalidate the all entries query used for genre list
      queryClient.invalidateQueries({ queryKey: ['allMangaEntries'] });
    },
  });
}

export function useUpdateMangaEntry(currentPage: number) {
  const { actor } = useActor();
  const { isActorReady } = useBackendReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, manga }: { id: string; manga: MangaEntry }) => {
      if (!isActorReady || !actor) {
        throw new Error('Backend is not ready. Please wait a moment and try again.');
      }
      return actor.updateEntry(id, manga);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mangaPage', currentPage] });
      queryClient.invalidateQueries({ queryKey: ['allMangaEntries'] });
    },
  });
}

export function useDeleteMangaEntry(currentPage: number) {
  const { actor } = useActor();
  const { isActorReady } = useBackendReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isActorReady || !actor) {
        throw new Error('Backend is not ready. Please wait a moment and try again.');
      }
      return actor.deleteEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mangaPage'] });
      queryClient.invalidateQueries({ queryKey: ['allMangaEntries'] });
    },
  });
}
