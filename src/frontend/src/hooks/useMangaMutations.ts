import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendConnection } from './useBackendConnection';
import { MangaEntry } from '../backend';
import { classifyError } from '../utils/backendErrorClassification';

export function useAddMangaEntry(currentPage: number) {
  const { actor, isReady } = useBackendConnection();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, manga }: { id: string; manga: MangaEntry }) => {
      if (!isReady || !actor) {
        throw new Error('Backend is not ready. Please wait for the connection to be established.');
      }
      return actor.addEntry(id, manga);
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
  const { actor, isReady } = useBackendConnection();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, manga }: { id: string; manga: MangaEntry }) => {
      if (!isReady || !actor) {
        throw new Error('Backend is not ready. Please wait for the connection to be established.');
      }
      return actor.updateEntry(id, manga);
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

export function useDeleteMangaEntry(currentPage: number) {
  const { actor, isReady } = useBackendConnection();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isReady || !actor) {
        throw new Error('Backend is not ready. Please wait for the connection to be established.');
      }
      return actor.deleteEntry(id);
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
