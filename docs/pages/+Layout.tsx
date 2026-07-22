import { useEffect, useState } from "react";
import "./Layout.css";
import { SearchDialog } from "../components/SearchDialog";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-night text-peak font-sans">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <a href="/" className="font-serif text-2xl tracking-tight">
          r8s
        </a>
        <div className="flex items-center gap-6 text-sm">
          <a href="/" className="text-peak/70 hover:text-peak transition-colors">Overview</a>
          <a href="/core" className="text-peak/70 hover:text-peak transition-colors">Core</a>
          <a href="/recipes" className="text-peak/70 hover:text-peak transition-colors">Recipes</a>
          <a href="/packages" className="text-peak/70 hover:text-peak transition-colors">Packages</a>
          <a href="/operators" className="text-peak/70 hover:text-peak transition-colors">Operators</a>
          <a href="/deployment" className="text-peak/70 hover:text-peak transition-colors">Deployment</a>
          <a href="/testing" className="text-peak/70 hover:text-peak transition-colors">Testing</a>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="ml-2 flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-cloud/60 hover:text-peak hover:border-white/20 transition-colors"
            aria-label="Open search"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-block font-mono text-xs text-cloud/50">⌘K</kbd>
          </button>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-12">
        {children}
      </main>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
