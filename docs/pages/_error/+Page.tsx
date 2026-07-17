export default function Page({ is404 }: { is404: boolean }) {
  if (is404) {
    return (
      <div className="space-y-8 text-center">
        <h1 className="text-6xl tracking-tight text-moss">404</h1>
        <h2 className="text-2xl text-cloud/80">Page Not Found</h2>
        <p className="text-cloud/60">
          The page you're looking for doesn't exist.
        </p>
        <a 
          href="/" 
          className="inline-block px-6 py-3 rounded-lg border border-moss text-moss hover:bg-moss hover:text-night transition-colors"
        >
          ← Back to home
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-center">
      <h1 className="text-6xl tracking-tight text-red-400">500</h1>
      <h2 className="text-2xl text-cloud/80">Something went wrong</h2>
      <p className="text-cloud/60">
        An error occurred while rendering this page.
      </p>
      <a 
        href="/" 
        className="inline-block px-6 py-3 rounded-lg border border-moss text-moss hover:bg-moss hover:text-night transition-colors"
      >
        ← Back to home
      </a>
    </div>
  );
}
