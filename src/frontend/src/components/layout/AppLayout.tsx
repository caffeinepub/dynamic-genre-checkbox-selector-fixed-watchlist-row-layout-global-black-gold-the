import { useState } from 'react';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';

interface AppLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
}

export function AppLayout({ children, header }: AppLayoutProps) {
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  const appIdentifier = typeof window !== 'undefined' 
    ? encodeURIComponent(window.location.hostname)
    : 'unknown-app';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-gold shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {!isHeaderCollapsed && (
              <div className="flex-1">
                {header}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
              className="ml-auto text-gold hover:bg-gold/10"
              aria-label={isHeaderCollapsed ? 'Expand header' : 'Collapse header'}
            >
              {isHeaderCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 bg-background">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gold bg-background py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gold">
          <p>
            © {new Date().getFullYear()} Built with{' '}
            <Heart className="inline h-4 w-4 text-accent fill-accent" />{' '}
            using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline font-semibold"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
