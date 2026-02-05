import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { MangaEntry } from '../backend';

export function useAddMangaEntry(currentPage: number) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, manga }: { id: string; manga: MangaEntry }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addEntry(id, manga);
    },
    onSuccess: () => {
      // Invalidate all manga page queries to refresh pagination
      queryClient.invalidateQueries({ queryKey: ['mangaPage'] });
    },
  });
}

export function useUpdateMangaEntry(currentPage: number) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, manga }: { id: string; manga: MangaEntry }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateEntry(id, manga);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mangaPage', currentPage] });
    },
  });
}

export function useDeleteMangaEntry(currentPage: number) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mangaPage'] });
    },
  });
}
