import { CodeBlock } from "../../components/CodeBlock";

const simpleExample = `import { App } from '@r8s/recipes';

export default () => (
  <App
    name="api"
    image="myapp/api:v1.2.3"
    host="api.example.com"
  />
);`;

const renderOutput = `$ npx r8s render
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
---
apiVersion: v1
kind: Service
metadata:
  name: api
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
# ... 3 resources rendered from 1 component`;

const withDatabase = `import { App, Database } from '@r8s/recipes';

export default () => (
  <>
    <Database name="api-db" storage="10Gi" />
    <App
      name="api"
      image="myapp/api:v1.2.3"
      host="api.example.com"
    />
  </>
);`;

const typeSafeExample = `function App({ environment }: { environment: 'staging' | 'production' }) {
  const replicas = environment === 'production' ? 3 : 1;

  return (
    <deployment
      metadata={{ name: 'api' }}
      spec={{
        replicas,
        template: {
          spec: {
            containers: [{
              name: 'api',
              image: 'myapp/api:v1',
            }],
          },
        },
      }}
    />
  );
}`;

const testExample = `import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import { App } from '@r8s/recipes';

describe('MyApp', () => {
  it('should create a Deployment with 3 replicas', () => {
    const result = render(
      <App name="api" image="myapp/api:v1" host="api.example.com" replicas={3} />
    );

    const deployment = result.resources.find(r => r.kind === 'Deployment');
    expect(deployment.spec.replicas).toBe(3);
  });
});`;

export default function Page() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="space-y-6">
        <h1 className="text-5xl tracking-tight">r8s</h1>
        <p className="text-2xl text-cloud/80 font-serif">
          Stop writing YAML. Start composing infrastructure.
        </p>
      </div>

      {/* The Problem vs Solution */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl text-cloud/60 uppercase tracking-wider font-medium">
            The Problem
          </h2>
          <p className="text-cloud/80 leading-relaxed">
            You have a microservice. It needs a Deployment, a Service, an Ingress with TLS, 
            and a PostgreSQL database. That's 300+ lines of YAML boilerplate. Copy-paste between 
            services. Hope you didn't miss an indentation.
          </p>
          <div className="space-y-2 text-sm text-cloud/60">
            <p>❌ Raw YAML — Copy-paste hell</p>
            <p>❌ Helm — values.yaml sprawl</p>
            <p>❌ Kustomize — Can't abstract logic</p>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-xl text-moss uppercase tracking-wider font-medium">
            The Solution
          </h2>
          <p className="text-cloud/80 leading-relaxed">
            One component. Three resources. All wired together with sensible defaults.
          </p>
          <CodeBlock code={simpleExample} language="tsx" />
          <CodeBlock code={renderOutput} language="bash" />
        </div>
      </div>

      {/* Why r8s */}
      <div className="space-y-6">
        <h2 className="text-3xl tracking-tight">Why r8s?</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border border-white/10">
            <h3 className="font-serif text-xl mb-3 text-moss">DRY by Default</h3>
            <p className="text-cloud/70 text-sm leading-relaxed">
              Your 10 microservices all need the same database setup? One component, imported everywhere.
            </p>
            <div className="mt-4">
              <CodeBlock code={withDatabase} language="tsx" />
            </div>
          </div>

          <div className="p-6 rounded-lg border border-white/10">
            <h3 className="font-serif text-xl mb-3 text-moss">Type Safety Out of the Box</h3>
            <p className="text-cloud/70 text-sm leading-relaxed">
              Misspelled <code>containerPort</code>? TypeScript catches it. Wrong <code>apiVersion</code>? 
              Red squiggly. No more <code>kubectl apply</code> → "error: validation failed."
            </p>
            <div className="mt-4">
              <CodeBlock code={typeSafeExample} language="tsx" />
            </div>
          </div>

          <div className="p-6 rounded-lg border border-white/10">
            <h3 className="font-serif text-xl mb-3 text-moss">Real Code, Real Logic</h3>
            <p className="text-cloud/70 text-sm leading-relaxed">
              Use conditionals, loops, and variables. Environment-specific configuration 
              without template syntax nightmares.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-white/10">
            <h3 className="font-serif text-xl mb-3 text-moss">Testable Infrastructure</h3>
            <p className="text-cloud/70 text-sm leading-relaxed">
              Because r8s components are just TypeScript functions, you can test them with 
              standard tools like Vitest.
            </p>
            <div className="mt-4">
              <CodeBlock code={testExample} language="tsx" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="space-y-6">
        <h2 className="text-3xl tracking-tight">Quick Start</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-moss font-mono text-sm">01</span>
            <h3 className="text-xl">Create a new project</h3>
          </div>
          <CodeBlock code={`npx r8s init my-project\ncd my-project\nnpm install`} language="bash" />
          
          <div className="flex items-center gap-4">
            <span className="text-moss font-mono text-sm">02</span>
            <h3 className="text-xl">Edit your components</h3>
          </div>
          <CodeBlock code={`import { App } from '@r8s/recipes';\n\nexport default () => (\n  <App\n    name="myapp"\n    image="myapp/web:v1.2.3"\n    host="myapp.example.com"\n    replicas={3}\n  />\n);`} language="tsx" />
          
          <div className="flex items-center gap-4">
            <span className="text-moss font-mono text-sm">03</span>
            <h3 className="text-xl">Render to YAML</h3>
          </div>
          <CodeBlock code={`npx r8s render --out k8s/manifest.yaml`} language="bash" />
        </div>
      </div>

      {/* Recipes */}
      <div className="space-y-6">
        <h2 className="text-3xl tracking-tight">Recipes</h2>
        <p className="text-cloud/70">
          Pre-built components for common infrastructure patterns. 
          <a href="/recipes" className="text-moss hover:text-lichen ml-2">Browse all recipes →</a>
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          <a href="/recipes/app" className="block p-6 rounded-lg border border-white/10 hover:border-moss transition-colors group">
            <h3 className="font-serif text-xl mb-2 group-hover:text-moss transition-colors">App</h3>
            <p className="text-sm text-cloud/60">Complete application stack with database, web service, and ingress</p>
          </a>
          <a href="/recipes/database" className="block p-6 rounded-lg border border-white/10 hover:border-moss transition-colors group">
            <h3 className="font-serif text-xl mb-2 group-hover:text-moss transition-colors">Database</h3>
            <p className="text-sm text-cloud/60">PostgreSQL cluster with CloudNativePG operator</p>
          </a>
          <a href="/recipes/web-service" className="block p-6 rounded-lg border border-white/10 hover:border-moss transition-colors group">
            <h3 className="font-serif text-xl mb-2 group-hover:text-moss transition-colors">Web Service</h3>
            <p className="text-sm text-cloud/60">Deployment with health checks and resource limits</p>
          </a>
          <a href="/recipes/ingress" className="block p-6 rounded-lg border border-white/10 hover:border-moss transition-colors group">
            <h3 className="font-serif text-xl mb-2 group-hover:text-moss transition-colors">Ingress</h3>
            <p className="text-sm text-cloud/60">TLS with cert-manager and nginx-ingress</p>
          </a>
        </div>
      </div>

      {/* Comparison */}
      <div className="space-y-6">
        <h2 className="text-3xl tracking-tight">Comparison</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-cloud/60 font-medium"></th>
                <th className="text-left py-3 px-4 text-cloud/60 font-medium">Raw YAML</th>
                <th className="text-left py-3 px-4 text-cloud/60 font-medium">Helm</th>
                <th className="text-left py-3 px-4 text-cloud/60 font-medium">Kustomize</th>
                <th className="text-left py-3 px-4 text-moss font-medium">r8s</th>
              </tr>
            </thead>
            <tbody className="text-cloud/80">
              <tr className="border-b border-white/5">
                <td className="py-3 px-4">Composition</td>
                <td className="py-3 px-4 text-cloud/40">❌ Copy-paste</td>
                <td className="py-3 px-4 text-cloud/40">⚠️ Templates</td>
                <td className="py-3 px-4 text-cloud/40">❌ Patches only</td>
                <td className="py-3 px-4 text-moss">✅ Components</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-4">Type Safety</td>
                <td className="py-3 px-4 text-cloud/40">❌</td>
                <td className="py-3 px-4 text-cloud/40">❌</td>
                <td className="py-3 px-4 text-cloud/40">❌</td>
                <td className="py-3 px-4 text-moss">✅ Full TS</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-4">DRY</td>
                <td className="py-3 px-4 text-cloud/40">❌</td>
                <td className="py-3 px-4 text-cloud/40">⚠️ Values files</td>
                <td className="py-3 px-4 text-cloud/40">⚠️ Bases</td>
                <td className="py-3 px-4 text-moss">✅ Import & reuse</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-4">Learning Curve</td>
                <td className="py-3 px-4 text-cloud/40">Low</td>
                <td className="py-3 px-4 text-cloud/40">Medium</td>
                <td className="py-3 px-4 text-cloud/40">Low</td>
                <td className="py-3 px-4 text-moss">Low</td>
              </tr>
              <tr>
                <td className="py-3 px-4">GitOps Friendly</td>
                <td className="py-3 px-4 text-cloud/40">✅</td>
                <td className="py-3 px-4 text-cloud/40">✅</td>
                <td className="py-3 px-4 text-cloud/40">✅</td>
                <td className="py-3 px-4 text-moss">✅ Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
