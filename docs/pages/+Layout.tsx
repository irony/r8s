import "./Layout.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-night text-peak font-sans">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <a href="/" className="font-serif text-2xl tracking-tight">
          r8s
        </a>
        <div className="flex gap-6 text-sm">
          <a href="/" className="text-peak/70 hover:text-peak transition-colors">Overview</a>
          <a href="/core" className="text-peak/70 hover:text-peak transition-colors">Core</a>
          <a href="/recipes" className="text-peak/70 hover:text-peak transition-colors">Recipes</a>
          <a href="/deployment" className="text-peak/70 hover:text-peak transition-colors">Deployment</a>
          <a href="/testing" className="text-peak/70 hover:text-peak transition-colors">Testing</a>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  );
}
