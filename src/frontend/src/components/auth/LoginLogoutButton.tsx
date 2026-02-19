import React from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { clearMangaCache } from '../../utils/offlineMangaCache';
import { clearCoverImagesForPrincipal } from '../../utils/offlineCoverImageIndexedDbCache';
import { clearServiceWorkerCache } from '../../sw/registerServiceWorker';

export default function LoginLogoutButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const text = loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login';

  const handleAuth = async () => {
    if (isAuthenticated) {
      const principal = identity?.getPrincipal().toString();
      
      await clear();
      queryClient.clear();
      
      clearMangaCache();
      
      if (principal) {
        await clearCoverImagesForPrincipal(principal);
      }
      
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
      className="text-gold"
    >
      {text}
    </Button>
  );
}
