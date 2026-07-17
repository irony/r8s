import { CodeBlock } from "../../components/CodeBlock";

const componentExample = `import { App } from '@r8s/recipes';

export default () => (
  <App
    name="api"
    image="myapp/api:v1.2.3"
    host="api.example.com"
  />
);`;

const compositionExample = `import { App, Database } from '@r8s/recipes';

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

const rawComponentsExample = `import { Database, Ingress } from '@r8s/recipes';

export default function CustomApp() {
  return (
    <>
      <Database name="myapp-db" storage="20Gi" />

      <deployment
        metadata={{ name: 'myapp-web' }}
        spec={{
          replicas: 3,
          template: {
            spec: {
              containers: [{
                name: 'web',
                image: 'myapp/web:v1.2.3',
                ports: [{ containerPort: 3000 }],
              }],
            },
          },
        }}
      />

      <service
        metadata={{ name: 'myapp-web' }}
        spec={{
          selector: { app: 'myapp-web' },
          ports: [{ port: 80, targetPort: 3000 }],
        }}
      />

      <Ingress
        host="myapp.example.com"
        serviceName="myapp-web"
        servicePort={80}
        tls={{ secretName: "myapp-tls", clusterIssuer: "letsencrypt" }}
      />
    </>
  );
}`;

const renderExample = `import { render } from '@r8s/core';
import { App, Database } from '@r8s/recipes';

const result = render(
  <>
    <Database name="app-db" storage="10Gi" />
    <App name="api" image="myapp/api:v1" host="api.example.com" />
  </>
);

// All Kubernetes resources
console.log(result.resources);
// [{ apiVersion: "apps/v1", kind: "Deployment", ... }, ...]

// All required operators
console.log(result.operators);
// [{ name: "cnpg", source: { type: "helm", ... } }, ...]`;

const contextExample = `import { Namespace, Labels } from '@r8s/core/defaults';
import { Database, App } from '@r8s/recipes';

export default function Platform() {
  return (
    <Namespace.Provider value="production">
      <Labels.Provider value={{ app: 'myapp', team: 'platform' }}>
        <Database name="app-db" storage="10Gi" />
        <App name="api" image="myapp/api:v1" host="api.example.com" />
      </Labels.Provider>
    </Namespace.Provider>
  );
}`;

export default function Page() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl tracking-tight">Core Concepts</h1>
        <p className="text-xl text-cloud/80">
          Learn the fundamentals of r8s in 5 minutes
        </p>
      </div>

      {/* Components */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="text-moss font-mono text-sm">01</span>
          <h2 className="text-2xl">Components</h2>
        </div>
        <p className="text-cloud/70 leading-relaxed">
          r8s components are TypeScript functions that return Kubernetes resources. 
          They follow the same pattern as React components but render infrastructure instead of DOM.
        </p>
        <CodeBlock code={componentExample} language="tsx" />
        <p className="text-cloud/70 text-sm">
          The <code>&lt;App&gt;</code> component above creates a Deployment, Service, and Ingress — 
          all wired together with sensible defaults.
        </p>
      </div>

      {/* Composition */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="text-moss font-mono text-sm">02</span>
          <h2 className="text-2xl">Composition</h2>
        </div>
        <p className="text-cloud/70 leading-relaxed">
          Compose multiple components together using fragments. Each component renders 
          its own resources, and the renderer flattens everything into a single list.
        </p>
        <CodeBlock code={compositionExample} language="tsx" />
      </div>

      {/* Escape Hatches */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="text-moss font-mono text-sm">03</span>
          <h2 className="text-2xl">Escape Hatches</h2>
        </div>
        <p className="text-cloud/70 leading-relaxed">
          Prefer raw Kubernetes? Every API resource is available as a lowercase component. 
          Drop down to raw components at any level:
        </p>
        <CodeBlock code={rawComponentsExample} language="tsx" />
      </div>

      {/* Rendering */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="text-moss font-mono text-sm">04</span>
          <h2 className="text-2xl">Rendering</h2>
        </div>
        <p className="text-cloud/70 leading-relaxed">
          The <code>render()</code> function takes your component tree and returns two things: 
          all Kubernetes resources and all required operators.
        </p>
        <CodeBlock code={renderExample} language="tsx" />
      </div>

      {/* Context */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="text-moss font-mono text-sm">05</span>
          <h2 className="text-2xl">Context</h2>
        </div>
        <p className="text-cloud/70 leading-relaxed">
          Share configuration across components using context — namespace, labels, 
          and operators can be provided once and consumed everywhere.
        </p>
        <CodeBlock code={contextExample} language="tsx" />
      </div>

      {/* Next Steps */}
      <div className="p-6 rounded-lg border border-white/10 bg-spruce/20">
        <h2 className="font-serif text-2xl mb-3">Ready to dive deeper?</h2>
        <p className="text-cloud/70 text-sm leading-relaxed">
          Check out the <a href="/recipes" className="text-moss hover:text-lichen">recipes</a> for 
          production-ready templates, or read about <a href="/deployment" className="text-moss hover:text-lichen">deployment strategies</a> 
          with FluxCD and GitHub Actions.
        </p>
      </div>
    </div>
  );
}
