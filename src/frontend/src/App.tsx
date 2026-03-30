import { Loader2 } from "lucide-react";
import React, { useEffect } from "react";
import ProfileSetupDialog from "./components/auth/ProfileSetupDialog";
import AppLayout from "./components/layout/AppLayout";
import MangaListPage from "./components/manga/MangaListPage";
import { BackendConnectionProvider } from "./context/BackendConnectionContext";
import { useBackendConnectionSingleton } from "./hooks/useBackendConnectionSingleton";
import { useGetCallerUserProfile } from "./hooks/useCurrentUserProfile";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { registerServiceWorker } from "./sw/registerServiceWorker";

function AppContent() {
  const { identity, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const { isConnecting, isFailed, errorMessage, retry } =
    useBackendConnectionSingleton();

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="text-center space-y-4">
            <h1
              className="text-4xl font-serif font-bold"
              style={{
                color: "#d4a017",
                textShadow: "0 0 20px rgba(212,160,23,0.4)",
              }}
            >
              Manga Watchlist
            </h1>
            <p style={{ color: "#8a6a10" }} className="text-lg">
              Track your manga reading journey
            </p>
            <p style={{ color: "#8a6a10" }} className="text-sm">
              {isLoggingIn
                ? "Logging in..."
                : "Please log in to access your watchlist"}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isConnecting || profileLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2
            className="animate-spin"
            style={{ color: "#d4a017" }}
            size={40}
          />
          <p style={{ color: "#8a6a10" }}>
            {isConnecting ? "Connecting to backend..." : "Loading profile..."}
          </p>
        </div>
      </AppLayout>
    );
  }

  if (isFailed) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-lg font-serif" style={{ color: "#d4a017" }}>
            Connection Error
          </p>
          <p
            className="text-sm text-center max-w-md"
            style={{ color: "#8a6a10" }}
          >
            {errorMessage ||
              "Failed to connect to the backend. Please try again."}
          </p>
          <button
            type="button"
            onClick={retry}
            className="px-6 py-2 border font-serif transition-all hover:shadow-gold-glow"
            style={{
              borderColor: "#d4a017",
              color: "#d4a017",
              backgroundColor: "transparent",
            }}
          >
            Retry Connection
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {showProfileSetup && <ProfileSetupDialog />}
      <MangaListPage />
    </AppLayout>
  );
}

export default function App() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <BackendConnectionProvider>
      <AppContent />
    </BackendConnectionProvider>
  );
}
