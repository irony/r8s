import { useEffect, useState } from "react";
import "./Layout.css";
import { SearchDialog } from "../components/SearchDialog";

interface NavItem {
  label: string;
  href: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Introduction",
    items: [
      { label: "Overview", href: "/" },
      { label: "Core Concepts", href: "/core" },
    ],
  },
  {
    title: "Components",
    items: [
      { label: "Recipes", href: "/recipes" },
      { label: "Packages", href: "/packages" },
      { label: "Operators", href: "/operators" },
    ],
  },
  {
    title: "Guides",
    items: [
      { label: "Deployment", href: "/deployment" },
      { label: "Testing", href: "/testing" },
    ],
  },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pathname, setPathname] = useState("");

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

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
      {/* Top bar */}
      <header className="border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 bg-night">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden text-cloud/60 hover:text-peak"
            aria-label="Toggle navigation"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <a href="/" className="font-serif text-2xl tracking-tight">
            r8s
          </a>
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-cloud/60 hover:text-peak hover:border-white/20 transition-colors"
          aria-label="Open search"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline-block font-mono text-xs text-cloud/50">⌘K</kbd>
        </button>
      </header>

      <div className="flex">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block w-60 shrink-0 border-r border-white/10 h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto">
          <Sidebar navGroups={NAV_GROUPS} pathname={pathname} />
        </aside>

        {/* Sidebar — mobile drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-black/60"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative w-64 bg-night border-r border-white/10 h-full overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className="font-serif text-lg">r8s</span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="text-cloud/60 hover:text-peak"
                  aria-label="Close navigation"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <Sidebar
                navGroups={NAV_GROUPS}
                pathname={pathname}
                onNavigate={() => setSidebarOpen(false)}
              />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 max-w-4xl mx-auto px-6 py-12 w-full">
          {children}
        </main>
      </div>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function Sidebar({
  navGroups,
  pathname,
  onNavigate,
}: {
  navGroups: NavGroup[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="px-3 py-4 space-y-6">
      {navGroups.map((group) => (
        <div key={group.title} className="space-y-1">
          <h3 className="text-xs uppercase tracking-wider text-cloud/40 font-medium px-3 mb-2">
            {group.title}
          </h3>
          {group.items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive(item.href, pathname)
                  ? "text-moss bg-white/5 font-medium"
                  : "text-cloud/70 hover:text-peak hover:bg-white/5"
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>
      ))}
    </nav>
  );
}
