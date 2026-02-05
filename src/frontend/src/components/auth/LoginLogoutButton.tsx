import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { LogIn, LogOut } from 'lucide-react';
import { clearMangaCache } from '../../utils/offlineMangaCache';
import { clearMangaIndexedDbCache } from '../../utils/offlineMangaIndexedDbCache';
import { clearCoverImagesForPrincipal } from '../../utils/offlineCoverImageIndexedDbCache';
import { clearServiceWorkerCache } from '../../sw/registerServiceWorker';

export function LoginLogoutButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      // Capture principal before clearing identity
      const principal = identity!.getPrincipal().toString();
      
      // Clear identity and React Query cache
      await clear();
      queryClient.clear();
      
      // Clear all caches for this principal
      clearMangaCache();
      await clearMangaIndexedDbCache(principal);
      await clearCoverImagesForPrincipal(principal);
      
      // Clear service worker caches
      await clearServiceWorkerCache();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <Button
      onClick={handleAuth}
      disabled={disabled}
      variant={isAuthenticated ? 'outline' : 'default'}
      className="gap-2"
    >
      {loginStatus === 'logging-in' ? (
        'Logging in...'
      ) : isAuthenticated ? (
        <>
          <LogOut className="h-4 w-4" />
          Logout
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4" />
          Login
        </>
      )}
    </Button>
  );
}
