import { ReactNode } from 'react';
import { LoginLogoutButton } from '../auth/LoginLogoutButton';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/generated/app-logo.dim_512x512.png" 
              alt="MangaList" 
              className="h-10 w-10"
            />
            <h1 className="text-2xl font-bold tracking-tight">MangaList</h1>
          </div>
          <LoginLogoutButton />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026. Built with ❤️ using <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">caffeine.ai</a></p>
        </div>
      </footer>
    </div>
  );
}
