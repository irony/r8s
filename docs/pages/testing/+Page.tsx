export default function Page() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl tracking-tight">Testing</h1>
      <p className="text-xl text-cloud/80">
        Coming soon — testing infrastructure with Vitest
      </p>
      <div className="p-6 rounded-lg border border-white/10 bg-spruce/20">
        <p className="text-cloud/70">
          This page is under construction. Check back soon for documentation on:
        </p>
        <ul className="mt-4 space-y-2 text-cloud/60">
          <li>• Unit testing components</li>
          <li>• Guardrails and validation</li>
          <li>• Snapshot testing</li>
          <li>• CI/CD integration</li>
        </ul>
      </div>
      <a href="/" className="text-moss hover:text-lichen">← Back to home</a>
    </div>
  );
}
