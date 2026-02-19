import { ReactNode, useState } from 'react';
import { LoginLogoutButton } from '../auth/LoginLogoutButton';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Heart } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className={`border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 transition-all duration-300 ${isHeaderCollapsed ? 'py-2' : 'py-4'}`}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          {!isHeaderCollapsed && (
            <>
              <div className="flex items-center gap-3">
                <img 
                  src="/assets/generated/app-logo.dim_512x512.png" 
                  alt="MangaList" 
                  className="h-10 w-10"
                />
                <h1 className="text-2xl font-bold tracking-tight text-foreground">MangaList</h1>
              </div>
              <LoginLogoutButton />
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${isHeaderCollapsed ? 'mx-auto' : 'ml-4'}`}
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            aria-label={isHeaderCollapsed ? 'Expand header' : 'Collapse header'}
          >
            {isHeaderCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-border mt-16 py-8 bg-background">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()}. Built with{' '}
            <Heart className="inline h-4 w-4 text-accent fill-accent" aria-label="love" />{' '}
            using{' '}
            <a 
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'mangalist-app')}`}
              target="_blank" 
              rel="noopener noreferrer" 
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
