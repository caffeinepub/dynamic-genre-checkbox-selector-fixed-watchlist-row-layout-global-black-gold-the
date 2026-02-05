import { useEffect } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useCurrentUserProfile';
import { AppLayout } from './components/layout/AppLayout';
import { ProfileSetupDialog } from './components/auth/ProfileSetupDialog';
import { MangaListPage } from './components/manga/MangaListPage';
import { BackendConnectionProvider } from './context/BackendConnectionContext';
import { Skeleton } from './components/ui/skeleton';
import { registerServiceWorker } from './sw/registerServiceWorker';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="space-y-4 w-full max-w-md">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show login prompt when not authenticated
  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="max-w-md space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Welcome to MangaList</h1>
              <p className="text-lg text-muted-foreground">
                Your personal manga watchlist. Track your reading progress, rate series, and never lose your place.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Please sign in to access your watchlist.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show profile setup if user is authenticated but has no profile
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (showProfileSetup) {
    return (
      <AppLayout>
        <ProfileSetupDialog open={true} />
      </AppLayout>
    );
  }

  // Show main manga list when authenticated and profile exists
  // Wrap with BackendConnectionProvider to ensure single connection instance
  return (
    <AppLayout>
      <BackendConnectionProvider>
        <MangaListPage />
      </BackendConnectionProvider>
    </AppLayout>
  );
}
