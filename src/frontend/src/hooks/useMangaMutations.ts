import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendConnectionSingleton } from './useBackendConnectionSingleton';
import { useInternetIdentity } from './useInternetIdentity';
import { MangaEntry, UpdateFields } from '../backend';
import { classifyError } from '../utils/backendErrorClassification';
import { assertBackendReady } from '../utils/backendNotReadyMessage';

export function useAddMangaEntry(currentPage: number) {
  const { actor, isReady } = useBackendConnectionSingleton();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (manga: MangaEntry) => {
      assertBackendReady(isReady, actor);
      if (!identity) throw new Error('Not authenticated');
      return actor!.addEntry(manga);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mangaPage', currentPage] });
      queryClient.invalidateQueries({ queryKey: ['allMangaEntries'] });
    },
    onError: (error) => {
      const classified = classifyError(error);
      console.error('Add manga error:', {
        category: classified.category,
        message: classified.message,
        userMessage: classified.userMessage,
      });
    },
  });
}

export function useUpdateMangaEntry(currentPage: number) {
  const { actor, isReady } = useBackendConnectionSingleton();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stableId, updates }: { stableId: bigint; updates: UpdateFields }) => {
      assertBackendReady(isReady, actor);
      if (!identity) throw new Error('Not authenticated');
      return actor!.updateEntry(stableId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mangaPage', currentPage] });
      queryClient.invalidateQueries({ queryKey: ['allMangaEntries'] });
    },
    onError: (error) => {
      const classified = classifyError(error);
      console.error('Update manga error:', {
        category: classified.category,
        message: classified.message,
        userMessage: classified.userMessage,
      });
    },
  });
}

export function useUpdateMangaRating() {
  const { actor, isReady } = useBackendConnectionSingleton();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stableId, rating }: { stableId: bigint; rating: number }) => {
      assertBackendReady(isReady, actor);
      if (!identity) throw new Error('Not authenticated');
      return actor!.updateRating(stableId, rating);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMangaEntries'] });
    },
    onError: (error) => {
      const classified = classifyError(error);
      console.error('Update rating error:', {
        category: classified.category,
        message: classified.message,
        userMessage: classified.userMessage,
      });
    },
  });
}

export function useToggleBookmark() {
  const { actor, isReady } = useBackendConnectionSingleton();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stableId: bigint) => {
      assertBackendReady(isReady, actor);
      if (!identity) throw new Error('Not authenticated');
      return actor!.toggleBookmark(stableId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMangaEntries'] });
    },
    onError: (error) => {
      const classified = classifyError(error);
      console.error('Toggle bookmark error:', {
        category: classified.category,
        message: classified.message,
        userMessage: classified.userMessage,
      });
    },
  });
}

export function useUpdateNotes() {
  const { actor, isReady } = useBackendConnectionSingleton();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stableId, notes }: { stableId: bigint; notes: string }) => {
      assertBackendReady(isReady, actor);
      if (!identity) throw new Error('Not authenticated');
      return actor!.updateNotes(stableId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMangaEntries'] });
    },
    onError: (error) => {
      const classified = classifyError(error);
      console.error('Update notes error:', {
        category: classified.category,
        message: classified.message,
        userMessage: classified.userMessage,
      });
    },
  });
}

export function useUpdateCompletionStatus() {
  const { actor, isReady } = useBackendConnectionSingleton();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stableId, completed }: { stableId: bigint; completed: boolean }) => {
      assertBackendReady(isReady, actor);
      if (!identity) throw new Error('Not authenticated');
      return actor!.updateCompletionStatus(stableId, completed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMangaEntries'] });
    },
    onError: (error) => {
      const classified = classifyError(error);
      console.error('Update completion status error:', {
        category: classified.category,
        message: classified.message,
        userMessage: classified.userMessage,
      });
    },
  });
}

export function useUpdateChapterProgress() {
  const { actor, isReady } = useBackendConnectionSingleton();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stableId, chaptersRead, availableChapters }: { stableId: bigint; chaptersRead: bigint; availableChapters: bigint }) => {
      assertBackendReady(isReady, actor);
      if (!identity) throw new Error('Not authenticated');
      return actor!.updateEntry(stableId, {
        stableId,
        chaptersRead,
        availableChapters,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMangaEntries'] });
    },
    onError: (error) => {
      const classified = classifyError(error);
      console.error('Update chapter progress error:', {
        category: classified.category,
        message: classified.message,
        userMessage: classified.userMessage,
      });
    },
  });
}

export function useDeleteMangaEntry(currentPage: number) {
  const { actor, isReady } = useBackendConnectionSingleton();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stableId: bigint) => {
      assertBackendReady(isReady, actor);
      if (!identity) throw new Error('Not authenticated');
      return actor!.deleteEntry(stableId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mangaPage', currentPage] });
      queryClient.invalidateQueries({ queryKey: ['allMangaEntries'] });
    },
    onError: (error) => {
      const classified = classifyError(error);
      console.error('Delete manga error:', {
        category: classified.category,
        message: classified.message,
        userMessage: classified.userMessage,
      });
    },
  });
}
