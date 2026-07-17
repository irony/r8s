import "./Layout.css";
import { Link } from "../components/Link";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-night text-peak font-sans">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <a href="/" className="font-serif text-2xl tracking-tight">
          r8s
        </a>
        <div className="flex gap-6 text-sm">
          <Link href="/">Overview</Link>
          <Link href="/core">Core</Link>
          <Link href="/recipes">Recipes</Link>
          <Link href="/deployment">Deployment</Link>
          <Link href="/testing">Testing</Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  );
}
