# r8s

**Kubernetes manifests as TSX components.**

Stop writing YAML. Start composing infrastructure.

```tsx
// k8s/r8s.tsx
import { App, Database } from '@r8s/recipes';

export default () => (
  <>
    <Database name="api-db" storage="20Gi" />

    <App
      name="api"
      image="myapp/api:v1.2.3"
      host="api.example.com"
    />
  </>
);
```

```bash
$ npx r8s render
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: api-db
---
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
# ... 4 resources rendered from 2 components
```

> **Batteries included, escape hatches included.** Compose `<Database>`, `<App>`, and other components like building blocks. Prefer raw Kubernetes? Every API resource is available as a lowercase component: `<deployment>`, `<service>`, `<ingress>`, `<configmap>`, `<secret>`, `<statefulset>`, `<daemonset>`, `<job>`, `<cronjob>`, `<hpa>`, `<pdb>`, `<rbac>` — compose them exactly as you need.

## Available Packages

| Package | Description | Operators |
|---------|-------------|-----------|
| `@r8s/core` | JSX factory + all Kubernetes API components (`<deployment>`, `<service>`, `<ingress>`, etc.) | — |
| `@r8s/recipes` | Pre-built components (`<App>`, `<Database>`, `<Ingress>`) | cnpg, nginx-ingress |
| `@r8s/cert-manager` | TLS certificates | cert-manager |
| `@r8s/vault` | Secret management | vault-secrets-operator |
| `@r8s/keycloak` | Identity management | keycloak-operator |
| `@r8s/external-dns` | DNS management | external-dns |
| `@r8s/redis` | Redis clusters | redis-operator |
| `@r8s/gateway` | Envoy Gateway (Gateway API) | envoy-gateway |
| `@r8s/monitoring` | Prometheus stack | kube-prometheus-stack |
| `@r8s/clickhouse` | ClickHouse database | clickhouse-operator |
| `@r8s/logging` | Log aggregation (Banzai Cloud) | logging-operator |
| `@r8s/loki` | Grafana Loki | loki |
| `@r8s/flux-controller` | FluxCD source controller | — |

## The Problem

You have a microservice. It needs:
- A Deployment
- A Service
- An Ingress with TLS
- A PostgreSQL database
- cert-manager for certificates
- nginx-ingress for routing

**Option A: Raw YAML** — 300+ lines of boilerplate. Copy-paste between services. Hope you didn't miss an indentation.

**Option B: Helm** — Great for packaging, terrible for composition. `values.yaml` sprawl. Debugging templates is a nightmare.

**Option C: Kustomize** — Good for patching, can't abstract logic. Every app needs its own overlay directory.

**Option D: Pulumi/CDK8s** — Powerful, but heavy. New DSL to learn. Often overkill for "just give me some YAML."

## The r8s Way

r8s brings **component composition** to Kubernetes — the same pattern that made React dominant for UIs:

| Concept | UI (React) | Infrastructure (r8s) |
|:---|:---|:---|
| Component | `<Button />` | `<Database />` |
| Composition | `<Header><Nav /></Header>` | `<><Database /><App /></>` |
| Props | `<Button color="red" />` | `<Database storage="20Gi" />` |
| Fragment | `<><A /><B /></>` | `<><Deployment /><Service /></>` |
| Reuse | `import Button from 'lib'` | `import Database from '@r8s/recipes'` |

### Why This Matters

**1. DRY by default**

Your 10 microservices all need the same database setup? One component, imported everywhere:

```tsx
import { Database } from '@r8s/recipes';

// Same component, different props
<Database name="user-db" storage="10Gi" />
<Database name="order-db" storage="100Gi" />
```

**2. Type safety out of the box**

Misspelled `containerPort`? TypeScript catches it. Wrong `apiVersion`? Red squiggly. No more `kubectl apply` → "error: validation failed."

**3. Real code, real logic**

```tsx
function App({ environment }: { environment: 'staging' | 'production' }) {
  const replicas = environment === 'production' ? 3 : 1;

  return (
    <>
      <deployment spec={{ replicas, ... }} />
      {environment === 'production' && <HPA targetCPU={80} />}
    </>
  );
}
```

**4. Explicit operator dependencies**

Every component declares which Kubernetes operators it needs. No more "forgot to install cert-manager" surprises:

```tsx
import { render } from '@r8s/core';
import { Database, Ingress } from '@r8s/recipes';

const result = render(
  <>
    <Database name="app-db" storage="10Gi" />
    <Ingress host="app.example.com" serviceName="app" tlsSecretName="app-tls" />
  </>
);

console.log(result.operators);
// [
//   { name: 'cnpg', source: { type: 'helm', chart: 'cloudnative-pg', ... } },
//   { name: 'nginx-ingress', source: { type: 'helm', chart: 'ingress-nginx', ... } },
//   { name: 'cert-manager', source: { type: 'helm', chart: 'cert-manager', ... } }
// ]
```

**5. Flat output**

Nested components render to a flat list of Kubernetes resources. No magic, no runtime — just YAML you can `kubectl apply`:

```
<>
  <Database />             →   ---
  <App />                  →   apiVersion: postgresql.cnpg.io/v1
</>                        →   kind: Cluster
                           →   metadata:
                           →     name: api-db
                           →   ---
                           →   apiVersion: apps/v1
                           →   kind: Deployment
                           →   ...
```

## Composition Pattern

The core idea: **compose components like building blocks**.

```tsx
import { App, Database } from '@r8s/recipes';

export default () => (
  <>
    <Database name="app-db" storage="20Gi" />
    <App name="api" image="myapp/api:v1" host="api.example.com" />
  </>
);
```

Each component creates the resources it needs:
- `<Database>` → PostgreSQL cluster + operator declaration
- `<App>` → Deployment + Service + Ingress

Add more components to the tree, they all render to the same flat YAML output.

## Quick Start

### 1. Create a new project

```bash
npx r8s init my-project
cd my-project
npm install
```

This scaffolds a complete project with:
- `k8s/r8s.tsx` — your Kubernetes components
- `tsconfig.json` — TypeScript config with JSX support
- `.github/workflows/render.yaml` — auto-render on push

### 2. Edit your components

Open `k8s/r8s.tsx` and customize:

```tsx
import { App, Database } from '@r8s/recipes';

export default () => (
  <>
    <Database name="myapp-db" storage="20Gi" />

    <App
      name="myapp"
      namespace="production"
      image="myapp/web:v1.2.3"
      host="myapp.example.com"
      tls={{ secretName: "myapp-tls", clusterIssuer: "letsencrypt" }}
      env={{ LOG_LEVEL: 'info' }}
      secrets={{ DATABASE_URL: 'app-secrets' }}
    />
  </>
);
```

This is the core pattern: **compose components like building blocks**. `<Database>` creates the PostgreSQL cluster, `<App>` creates the Deployment, Service, and Ingress — all wired together.

Need just a simple app without a database?

```tsx
import { App } from '@r8s/recipes';

export default () => (
  <App
    name="myapp"
    namespace="production"
    image="myapp/web:v1.2.3"
    host="myapp.example.com"
    replicas={3}
    tls={{ secretName: "myapp-tls", clusterIssuer: "letsencrypt" }}
    resources={{
      requests: { cpu: "100m", memory: "128Mi" },
      limits: { cpu: "500m", memory: "512Mi" },
    }}
  />
);
```

Or drop down to raw components at any level:

```tsx
import { Database, Ingress } from '@r8s/recipes';

export default function CustomApp() {
  return (
    <>
      <Database name="myapp-db" storage="20Gi" />

      <deployment
        apiVersion="apps/v1"
        kind="Deployment"
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
        apiVersion="v1"
        kind="Service"
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
}
```

### 3. Render to YAML

```bash
$ npm run render-k8s
# or
$ npx r8s render --out k8s/manifest.yaml
```

Output: Kubernetes resources rendered as valid YAML, plus a list of required operators.

### Templates

Use `--template` to scaffold different project types:

```bash
npx r8s init my-project --template basic     # Simple app + db
npx r8s init my-project --template fullstack # Frontend + API + DB
```

## Operator Dependencies

r8s components declare their Kubernetes operator dependencies explicitly. This makes your infrastructure:

- **Type-safe**: declared in code, not documentation
- **Testable**: verified in unit tests
- **Versioned**: specific operator versions pinned
- **Composable**: multiple components can share the same operator

### How It Works

Components declare operators using `declareOperator()`:

```tsx
import { declareOperator, useContext } from '@r8s/core';
import { OperatorContext } from '@r8s/core/defaults';
import { cnpgOperator } from '@r8s/recipes';

function Database(props) {
  const sharedOperators = useContext(OperatorContext);

  // Only declare if not already provided via context
  const hasCNPG = sharedOperators.some(op => op.name === 'cnpg');

  return [
    !hasCNPG && declareOperator(cnpgOperator('1.22.5')),
    <Cluster ... />,
  ];
}
```

The renderer collects all operators and deduplicates by name:

```tsx
import { render } from '@r8s/core';

const result = render(<MyApp />);

console.log(result.operators);
// [{ name: 'cnpg', source: { ... } }, { name: 'cert-manager', source: { ... } }]
```

## Deployment Strategies

### GitHub Actions (default)

Render TSX → YAML in CI, commit to repo:

```bash
npx r8s init my-project --strategy github-actions
```

### Flux Controller

Keep .tsx files, render in-cluster via FluxCD:

```bash
npx r8s init my-project --strategy flux-controller
```

## Contributing

### Missing Something?

r8s is designed to be extended. If you need a component that doesn't exist yet, it's easy to add:

```tsx
// packages/my-operator/src/index.ts
import { declareOperator } from '@r8s/core';

export const myOperator = declareOperator({
  name: 'my-operator',
  source: {
    type: 'helm',
    chart: 'my-chart',
    repo: 'https://charts.example.com',
    version: '1.0.0',
  },
});

export function MyComponent(props: { name: string; replicas?: number }) {
  return (
    <deployment
      apiVersion="apps/v1"
      kind="Deployment"
      metadata={{ name: props.name }}
      spec={{
        replicas: props.replicas || 1,
        template: {
          spec: {
            containers: [{
              name: 'app',
              image: 'myapp:latest',
            }],
          },
        },
      }}
    />
  );
}
```

1. Create a new package under `packages/`
2. Export your operator with `declareOperator()`
3. Export your components as TSX functions
4. Add tests in `__tests__/`
5. Open a PR — we review within 24 hours

See existing packages (`packages/recipes`, `packages/redis`, `packages/monitoring`) for patterns and conventions.

## License

MIT
