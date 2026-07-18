import { CodeBlock } from "../../components/CodeBlock";

const basicExample = `import { Database, Ingress } from '@r8s/recipes';

export default (
  <>
    <Database name="app-db" storage="10Gi" />
    <Ingress host="app.example.com" serviceName="app" />
  </>
);`;

const basicYaml = `# Rendered Kubernetes resources
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: app-db
  namespace: default
spec:
  instances: 3
  storage:
    size: 10Gi
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: default
spec:
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app
                port:
                  number: 80`;

const renderExample = `import { render } from '@r8s/core';

const result = render(<MyApp />);

// Kubernetes resources
console.log(result.resources);
// [Cluster, Secret, Ingress, Service, ...]

// Required operators (auto-detected)
console.log(result.operators);`;

const renderYaml = `# Auto-detected operators
[
  {
    "name": "cnpg",
    "source": {
      "type": "helm",
      "chart": "cloudnative-pg",
      "repo": "https://cloudnative-pg.github.io/charts",
      "version": "0.20.0"
    }
  },
  {
    "name": "nginx-ingress",
    "source": {
      "type": "helm",
      "chart": "ingress-nginx",
      "repo": "https://kubernetes.github.io/ingress-nginx",
      "version": "4.9.0"
    }
  },
  {
    "name": "cert-manager",
    "source": {
      "type": "helm",
      "chart": "cert-manager",
      "repo": "https://charts.jetstack.io",
      "version": "1.13.0"
    }
  }
]`;

const installManual = `# Install cert-manager
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \\
  --namespace cert-manager \\
  --create-namespace \\
  --set installCRDs=true

# Install nginx-ingress
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install nginx-ingress ingress-nginx/ingress-nginx \\
  --namespace ingress-nginx \\
  --create-namespace

# Install CloudNativePG
helm repo add cnpg https://cloudnative-pg.github.io/charts
helm install cnpg cnpg/cloudnative-pg \\
  --namespace cnpg-system \\
  --create-namespace`;

const fluxExample = `apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: operators
  namespace: flux-system
spec:
  interval: 1h
  path: ./operators
  sourceRef:
    kind: GitRepository
    name: infrastructure
  postBuild:
    substituteFrom:
      - kind: ConfigMap
        name: cluster-vars`;

const declareOperator = `import { declareOperator } from '@r8s/core';

export const myOperator = declareOperator({
  name: 'my-operator',
  source: {
    type: 'helm',
    chart: 'my-chart',
    repo: 'https://charts.example.com',
    version: '1.0.0',
  },
});

export function MyComponent(props: { name: string }) {
  return [
    myOperator,
    <deployment
      metadata={{ name: props.name }}
      spec={{ replicas: 1, template: { spec: { containers: [{ name: 'app', image: 'myapp' }] } } }}
    />,
  ];
}`;

const declareYaml = `# Rendered output includes operator + resources
[
  {
    "type": "operator",
    "name": "my-operator",
    "source": {
      "type": "helm",
      "chart": "my-chart",
      "repo": "https://charts.example.com",
      "version": "1.0.0"
    }
  },
  {
    "apiVersion": "apps/v1",
    "kind": "Deployment",
    "metadata": { "name": "myapp" },
    "spec": {
      "replicas": 1,
      "template": {
        "spec": {
          "containers": [{ "name": "app", "image": "myapp" }]
        }
      }
    }
  }
]`;

const contextExample = `import { OperatorContext } from '@r8s/core/defaults';
import { Database, Ingress } from '@r8s/recipes';
import { cnpgOperator, nginxIngressOperator } from '@r8s/recipes';
import { certManagerOperator } from '@r8s/cert-manager';

export default function Platform() {
  return (
    <OperatorContext.Provider value={[
      cnpgOperator('1.22.5'),
      certManagerOperator('1.14.0'),
      nginxIngressOperator('1.15.1'),
    ]}>
      <Database name="app-db" storage="10Gi" />
      <Ingress host="app.example.com" serviceName="app" />
    </OperatorContext.Provider>
  );
}`;

const contextYaml = `# Operators provided via context - not duplicated
# Only resources are rendered
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: app-db
  namespace: default
spec:
  instances: 3
  storage:
    size: 10Gi
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: default
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  tls:
    - hosts:
        - app.example.com
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app
                port:
                  number: 80`;

const dedupExample = `// Component A declares cnpg
function DatabaseA() {
  return [
    declareOperator(cnpgOperator('1.22.5')),
    <Cluster name="db-a" storage="10Gi" />,
  ];
}

// Component B also declares cnpg
function DatabaseB() {
  return [
    declareOperator(cnpgOperator('1.22.5')),
    <Cluster name="db-b" storage="10Gi" />,
  ];
}

// Result: cnpg appears only once in operators list
const result = render(
  <>
    <DatabaseA />
    <DatabaseB />
  </>
);

console.log(result.operators);
// [{ name: 'cnpg', ... }] — deduplicated!`;

const dedupYaml = `# Operators (deduplicated)
[
  {
    "name": "cnpg",
    "source": {
      "type": "helm",
      "chart": "cloudnative-pg",
      "version": "1.22.5"
    }
  }
]

# Resources (both clusters rendered)
---
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: db-a
spec:
  storage:
    size: 10Gi
---
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: db-b
spec:
  storage:
    size: 10Gi`;

export default function Page() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl tracking-tight">Operators & Dependencies</h1>
        <p className="text-xl text-cloud/80">
          r8s tracks Kubernetes operator dependencies automatically. No more "forgot to install cert-manager" surprises.
        </p>
      </div>

      {/* The Problem */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">The Problem</h2>
        <div className="p-6 rounded-lg border border-white/10 bg-red-500/5">
          <p className="text-cloud/80 leading-relaxed">
            You deploy your app. Everything looks fine. Then you realize:
          </p>
          <ul className="mt-4 space-y-2 text-cloud/70">
            <li>❌ The Ingress doesn't work — nginx-ingress isn't installed</li>
            <li>❌ TLS certificates aren't issued — cert-manager is missing</li>
            <li>❌ Database pods are stuck — CloudNativePG operator isn't running</li>
          </ul>
          <p className="mt-4 text-cloud/60 text-sm">
            These errors show up <em>after</em> deployment, often in production. 
            The dependencies are documented somewhere, but not enforced.
          </p>
        </div>
      </div>

      {/* The r8s Way */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">The r8s Way</h2>
        <p className="text-cloud/70 leading-relaxed">
          Every r8s component declares its operator dependencies explicitly. When you render your infrastructure, 
          you get a complete list of everything that needs to be installed.
        </p>
        <CodeBlock code={basicExample} yaml={basicYaml} language="tsx" />
        <CodeBlock code={renderExample} yaml={renderYaml} language="tsx" />
      </div>

      {/* How It Works */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">How It Works</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border border-white/10">
            <div className="text-moss font-mono text-sm mb-3">01</div>
            <h3 className="font-serif text-xl mb-3">Declare</h3>
            <p className="text-cloud/70 text-sm">
              Components declare operators using <code>declareOperator()</code>. 
              This happens inside the component, close to where the operator is actually used.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-white/10">
            <div className="text-moss font-mono text-sm mb-3">02</div>
            <h3 className="font-serif text-xl mb-3">Collect</h3>
            <p className="text-cloud/70 text-sm">
              The renderer walks the component tree and collects all operator declarations. 
              Duplicates are automatically removed.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-white/10">
            <div className="text-moss font-mono text-sm mb-3">03</div>
            <h3 className="font-serif text-xl mb-3">Install</h3>
            <p className="text-cloud/70 text-sm">
              You get a flat list of operators with installation instructions. 
              Install manually, or use FluxCD for GitOps automation.
            </p>
          </div>
        </div>
      </div>

      {/* Deduplication */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Automatic Deduplication</h2>
        <p className="text-cloud/70">
          Multiple components can declare the same operator. r8s deduplicates them automatically:
        </p>
        <CodeBlock code={dedupExample} yaml={dedupYaml} language="tsx" />
      </div>

      {/* Context */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Shared Operators via Context</h2>
        <p className="text-cloud/70">
          For a complete platform, provide shared operators via context. Components won't duplicate them:
        </p>
        <CodeBlock code={contextExample} yaml={contextYaml} language="tsx" />
      </div>

      {/* Installation */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Installing Operators</h2>
        
        <div className="space-y-4">
          <h3 className="text-xl">Option 1: Manual Installation</h3>
          <p className="text-cloud/70">
            Use Helm to install operators directly. r8s provides the exact chart and version:
          </p>
          <CodeBlock code={installManual} language="bash" />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl">Option 2: FluxCD (GitOps)</h3>
          <p className="text-cloud/70">
            Let FluxCD manage operators automatically. Add them to your Git repository:
          </p>
          <CodeBlock code={fluxExample} language="yaml" />
        </div>
      </div>

      {/* Custom Operators */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Creating Custom Operators</h2>
        <p className="text-cloud/70">
          Building your own components? Declare their operator dependencies:
        </p>
        <CodeBlock code={declareOperator} yaml={declareYaml} language="tsx" />
      </div>

      {/* Available Operators */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Available Operators</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-cloud/60 font-medium">Operator</th>
                <th className="text-left py-3 px-4 text-cloud/60 font-medium">Package</th>
                <th className="text-left py-3 px-4 text-cloud/60 font-medium">Purpose</th>
                <th className="text-left py-3 px-4 text-cloud/60 font-medium">Helm Chart</th>
              </tr>
            </thead>
            <tbody className="text-cloud/80">
              <tr className="border-b border-white/5">
                <td className="py-3 px-4 font-medium">CloudNativePG</td>
                <td className="py-3 px-4 font-mono text-cloud/60">@r8s/recipes</td>
                <td className="py-3 px-4">PostgreSQL clusters</td>
                <td className="py-3 px-4 font-mono text-cloud/60">cloudnative-pg</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-4 font-medium">nginx-ingress</td>
                <td className="py-3 px-4 font-mono text-cloud/60">@r8s/recipes</td>
                <td className="py-3 px-4">HTTP routing</td>
                <td className="py-3 px-4 font-mono text-cloud/60">ingress-nginx</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-4 font-medium">cert-manager</td>
                <td className="py-3 px-4 font-mono text-cloud/60">@r8s/cert-manager</td>
                <td className="py-3 px-4">TLS certificates</td>
                <td className="py-3 px-4 font-mono text-cloud/60">cert-manager</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-4 font-medium">external-dns</td>
                <td className="py-3 px-4 font-mono text-cloud/60">@r8s/external-dns</td>
                <td className="py-3 px-4">DNS management</td>
                <td className="py-3 px-4 font-mono text-cloud/60">external-dns</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-4 font-medium">Vault Secrets</td>
                <td className="py-3 px-4 font-mono text-cloud/60">@r8s/vault</td>
                <td className="py-3 px-4">Secret management</td>
                <td className="py-3 px-4 font-mono text-cloud/60">vault-secrets-operator</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-4 font-medium">Keycloak</td>
                <td className="py-3 px-4 font-mono text-cloud/60">@r8s/keycloak</td>
                <td className="py-3 px-4">Identity management</td>
                <td className="py-3 px-4 font-mono text-cloud/60">keycloak-operator</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-4 font-medium">Redis</td>
                <td className="py-3 px-4 font-mono text-cloud/60">@r8s/redis</td>
                <td className="py-3 px-4">Redis clusters</td>
                <td className="py-3 px-4 font-mono text-cloud/60">redis-operator</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Prometheus</td>
                <td className="py-3 px-4 font-mono text-cloud/60">@r8s/monitoring</td>
                <td className="py-3 px-4">Monitoring stack</td>
                <td className="py-3 px-4 font-mono text-cloud/60">kube-prometheus-stack</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Next Steps */}
      <div className="p-6 rounded-lg border border-white/10 bg-spruce/20">
        <h2 className="font-serif text-2xl mb-3">Ready to use operators?</h2>
        <p className="text-cloud/70 text-sm leading-relaxed">
          Check out the <a href="/recipes" className="text-moss hover:text-lichen">recipes</a> to see operators in action, 
          or read about <a href="/deployment" className="text-moss hover:text-lichen">deployment strategies</a> with FluxCD.
        </p>
      </div>
    </div>
  );
}
