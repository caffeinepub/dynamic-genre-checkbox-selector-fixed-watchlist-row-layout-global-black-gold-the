import React from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { clearServiceWorkerCache } from '../../sw/registerServiceWorker';
import { clearMangaIndexedDbCache } from '../../utils/offlineMangaIndexedDbCache';
import { clearCoverImagesForPrincipal } from '../../utils/offlineCoverImageIndexedDbCache';
import { Loader2, LogIn, LogOut } from 'lucide-react';

export default function LoginLogoutButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      // Clear all caches on logout
      try {
        const principal = identity?.getPrincipal().toString();
        if (principal) {
          await clearMangaIndexedDbCache(principal);
          await clearCoverImagesForPrincipal(principal);
        }
        await clearServiceWorkerCache();
      } catch {
        // Ignore cache clearing errors
      }
      queryClient.clear();
      await clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        if (errMsg === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <button
      onClick={handleAuth}
      disabled={isLoggingIn}
      className="flex items-center gap-2 px-4 py-1.5 text-sm font-serif border transition-all duration-200 disabled:opacity-50"
      style={{
        borderColor: '#d4a017',
        color: '#d4a017',
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(212,160,23,0.1)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 8px rgba(212,160,23,0.4)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
      }}
    >
      {isLoggingIn ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span>Logging in...</span>
        </>
      ) : isAuthenticated ? (
        <>
          <LogOut size={14} />
          <span>Logout</span>
        </>
      ) : (
        <>
          <LogIn size={14} />
          <span>Login</span>
        </>
      )}
    </button>
  );
}
