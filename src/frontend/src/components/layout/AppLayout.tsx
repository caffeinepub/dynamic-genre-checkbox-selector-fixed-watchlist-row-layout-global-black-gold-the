import { BookOpen, ChevronDown, ChevronUp, Heart } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import LoginLogoutButton from "../auth/LoginLogoutButton";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setHeaderCollapsed(true);
      } else if (currentScrollY < lastScrollY.current) {
        setHeaderCollapsed(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const appId =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.hostname)
      : "manga-watchlist";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#000000", color: "#d4a017" }}
    >
      {/* Sticky Header */}
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: "#000000",
          borderBottom: "1px solid #d4a017",
          boxShadow: "0 2px 12px rgba(212,160,23,0.2)",
        }}
      >
        <div
          className={`max-w-7xl mx-auto px-4 flex items-center justify-between transition-all duration-300 ${
            headerCollapsed ? "py-1" : "py-3"
          }`}
        >
          <div className="flex items-center gap-3">
            <BookOpen
              size={headerCollapsed ? 20 : 28}
              className="transition-all duration-300"
              style={{ color: "#d4a017" }}
            />
            <div>
              <h1
                className={`font-serif font-bold transition-all duration-300 ${
                  headerCollapsed ? "text-base" : "text-xl"
                }`}
                style={{
                  color: "#d4a017",
                  textShadow: "0 0 10px rgba(212,160,23,0.4)",
                }}
              >
                Manga Watchlist
              </h1>
              {!headerCollapsed && (
                <p className="text-xs" style={{ color: "#8a6a10" }}>
                  Your personal reading tracker
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setHeaderCollapsed(!headerCollapsed)}
                className="p-1 transition-colors"
                style={{ color: "#8a6a10" }}
                aria-label={
                  headerCollapsed ? "Expand header" : "Collapse header"
                }
              >
                {headerCollapsed ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronUp size={16} />
                )}
              </button>
            )}
            <LoginLogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">{children}</main>

      {/* Footer */}
      <footer
        className="mt-auto py-4 px-4 text-center text-xs"
        style={{
          backgroundColor: "#000000",
          borderTop: "1px solid #d4a017",
          color: "#8a6a10",
        }}
      >
        <div className="flex items-center justify-center gap-1 flex-wrap">
          <span>© {new Date().getFullYear()} Manga Watchlist</span>
          <span className="mx-1">·</span>
          <span className="flex items-center gap-1">
            Built with{" "}
            <Heart
              size={12}
              className="inline"
              style={{ color: "#d4a017", fill: "#d4a017" }}
            />{" "}
            using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:underline"
              style={{ color: "#d4a017" }}
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
