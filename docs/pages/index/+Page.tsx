import { CodeBlock } from "../../components/CodeBlock";

const quickStartCode = `npm install @r8s/core @r8s/recipes`;

const exampleCode = `import { App } from '@r8s/recipes';

export default (
  <App
    name="api"
    image="myapp/api:v1"
    host="api.example.com"
    database={{ name: "app-db", storage: "10Gi" }}
  />
);`;

export default function Page() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-5xl tracking-tight">r8s</h1>
        <p className="text-xl text-cloud/80">
          Kubernetes infrastructure as TypeScript components
        </p>
      </div>

      <div className="prose prose-invert max-w-none">
        <p className="text-base leading-relaxed">
          r8s (pronounced "rates") lets you define Kubernetes infrastructure
          using familiar TSX components. Think React for infrastructure —
          composable, testable, and type-safe.
        </p>

        <h2 className="text-2xl mt-8 mb-4">Quick Start</h2>
        <CodeBlock code={quickStartCode} language="bash" />

        <h2 className="text-2xl mt-8 mb-4">Example</h2>
        <CodeBlock code={exampleCode} language="tsx" />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-12">
        <a href="/core" className="block p-6 rounded-lg border border-white/10 hover:border-moss transition-colors">
          <h3 className="font-serif text-xl mb-2">Core Concepts</h3>
          <p className="text-sm text-cloud/60">Components, context, rendering, operators</p>
        </a>
        <a href="/recipes" className="block p-6 rounded-lg border border-white/10 hover:border-moss transition-colors">
          <h3 className="font-serif text-xl mb-2">Recipes</h3>
          <p className="text-sm text-cloud/60">Database, WebService, Ingress, App</p>
        </a>
        <a href="/deployment" className="block p-6 rounded-lg border border-white/10 hover:border-moss transition-colors">
          <h3 className="font-serif text-xl mb-2">Deployment</h3>
          <p className="text-sm text-cloud/60">FluxCD, GitHub Actions, strategies</p>
        </a>
        <a href="/testing" className="block p-6 rounded-lg border border-white/10 hover:border-moss transition-colors">
          <h3 className="font-serif text-xl mb-2">Testing</h3>
          <p className="text-sm text-cloud/60">Unit tests, guardrails, validation</p>
        </a>
      </div>
    </div>
  );
}
