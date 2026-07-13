# ReactNetes

**Kubernetes manifests as TSX components.**

Stop writing YAML. Start composing infrastructure.

```tsx
// k8s/ReactNetes.tsx
import { Postgres, CustomIngress } from '@reactnetes/recipes';

export default () => (
  <>
    <Postgres name="api-db" database="myapp" storage="20Gi" />
    
    <deployment
      apiVersion="apps/v1"
      kind="Deployment"
      metadata={{ name: "api" }}
      spec={{
        replicas: 3,
        template: {
          spec: {
            containers: [{
              name: "api",
              image: "myapp/api:v1.2.3",
              ports: [{ containerPort: 3000 }]
            }]
          }
        }
      }}
    />
    
    <CustomIngress
      host="api.example.com"
      serviceName="api"
      tlsSecretName="api-tls"
    />
  </>
);
```

```bash
$ npx reactnetes render
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: api-db
---
apiVersion: v1
kind: Service
metadata:
  name: api-db
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
---
# ... 6 resources rendered from 1 file
```

## The Problem

You have a microservice. It needs:
- A Deployment
- A Service  
- A ConfigMap for env vars
- A Secret for credentials
- An Ingress with TLS
- A Postgres database

**Option A: Raw YAML** — 300+ lines of boilerplate. Copy-paste between services. Hope you didn't miss an indentation.

**Option B: Helm** — Great for packaging, terrible for composition. `values.yaml` sprawl. Debugging templates is a nightmare.

**Option C: Kustomize** — Good for patching, can't abstract logic. Every app needs its own overlay directory.

**Option D: Pulumi/CDK8s** — Powerful, but heavy. New DSL to learn. Often overkill for "just give me some YAML."

## The ReactNetes Way

ReactNetes brings **component composition** to Kubernetes — the same pattern that made React dominant for UIs:

| Concept | UI (React) | Infrastructure (ReactNetes) |
|:---|:---|:---|
| Component | `<Button />` | `<Postgres />` |
| Composition | `<Header><Nav /></Header>` | `<App><Api /><Db /></App>` |
| Props | `<Button color="red" />` | `<Postgres storage="20Gi" />` |
| Fragment | `<><A /><B /></>` | `<><Deployment /><Service /></>` |
| Reuse | `import Button from 'lib'` | `import Postgres from '@reactnetes/recipes'` |

### Why This Matters

**1. DRY by default**

Your 10 microservices all need the same Postgres setup? One component, imported everywhere:

```tsx
import { Postgres } from '@reactnetes/recipes';

// Same component, different props
<Postgres name="user-db" database="users" />
<Postgres name="order-db" database="orders" storage="100Gi" />
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

**4. Flat output**

Nested components render to a flat list of Kubernetes resources. No magic, no runtime — just YAML you can `kubectl apply`:

```
<App>                      →   ---
  <Postgres />             →   apiVersion: apps/v1
  <Api />                  →   kind: StatefulSet
</App>                     →   metadata:
                                name: api-db
                              ---
                              apiVersion: v1
                              kind: Service
                              ...
```

## Quick Start

### 1. Create a new project

```bash
npx reactnetes init my-project
cd my-project
npm install
```

This scaffolds a complete project with:
- `k8s/ReactNetes.tsx` — your Kubernetes components
- `tsconfig.json` — TypeScript config with JSX support
- `.github/workflows/render.yaml` — auto-render on push

### 2. Edit your components

Open `k8s/ReactNetes.tsx` and customize:

```tsx
import { Postgres, CustomIngress } from '@reactnetes/recipes';

export default function App() {
  return (
    <>
      <Postgres
        name="myapp-db"
        namespace="production"
        database="myapp"
        user="myapp"
        password="supersecret"
        storage="20Gi"
      />

      <deployment
        apiVersion="apps/v1"
        kind="Deployment"
        metadata={{ name: 'myapp-web', namespace: 'production', labels: { app: 'myapp-web' } }}
        spec={{
          replicas: 3,
          selector: { matchLabels: { app: 'myapp-web' } },
          template: {
            metadata: { labels: { app: 'myapp-web' } },
            spec: {
              containers: [{
                name: 'web',
                image: 'myapp/web:v1.2.3',
                ports: [{ containerPort: 3000 }],
                env: [{
                  name: 'DATABASE_URL',
                  value: 'postgresql://myapp:supersecret@myapp-db:5432/myapp',
                }],
              }],
            },
          },
        }}
      />

      <service
        apiVersion="v1"
        kind="Service"
        metadata={{ name: 'myapp-web', namespace: 'production' }}
        spec={{
          type: 'ClusterIP',
          selector: { app: 'myapp-web' },
          ports: [{ port: 80, targetPort: 3000 }],
        }}
      />

      <CustomIngress
        name="myapp-ingress"
        namespace="production"
        host="myapp.example.com"
        serviceName="myapp-web"
        servicePort={80}
        tlsSecretName="myapp-tls"
        annotations={{
          'nginx.ingress.kubernetes.io/rate-limit': '100',
        }}
      />
    </>
  );
}
```

### 3. Render to YAML

```bash
$ npm run render-k8s
# or
$ npx reactnetes render --out k8s/manifest.yaml
```

Output: 6 Kubernetes resources (StatefulSet, Service, ConfigMap, Deployment, Service, Ingress) rendered as valid YAML.

### Templates

Use `--template` to scaffold different project types:

```bash
npx reactnetes init my-project --template basic     # Simple app + db
npx reactnetes init my-project --template fullstack # Frontend + API + DB
```

## Demo

Run the included demo to see ReactNetes in action:

```bash
# Clone the repo
git clone https://github.com/yourusername/reactnetes.git
cd reactnetes

# Install dependencies
npm install

# Run the demo
./demo.sh
```

This will show you:
1. The project structure
2. The TSX source file
3. The rendered YAML output

## Recipes

Pre-built components for common infrastructure:

### `<Postgres />`

Creates: StatefulSet + Service + ConfigMap + PVC

```tsx
import { Postgres } from '@reactnetes/recipes';

<Postgres
  name="api-db"
  namespace="production"
  database="myapp"
  user="myapp"
  password="supersecret"
  storage="20Gi"
  replicas={1}
/>
```

### `<CustomIngress />`

Creates: Ingress with nginx + cert-manager defaults

```tsx
import { CustomIngress } from '@reactnetes/recipes';

<CustomIngress
  name="api-ingress"
  host="api.example.com"
  serviceName="api"
  servicePort={80}
  tlsSecretName="api-tls"
  annotations={{
    'nginx.ingress.kubernetes.io/rate-limit': '100',
  }}
/>
```

## How It Works

### JSX Without React

ReactNetes provides its own lightweight JSX factory. No React dependency, no virtual DOM — just a tree that flattens to Kubernetes resources:

```tsx
// This JSX...
<>
  <deployment apiVersion="apps/v1" kind="Deployment" metadata={{ name: "app" }} spec={...} />
  <service apiVersion="v1" kind="Service" metadata={{ name: "app" }} spec={...} />
</>

// ...becomes this tree:
{
  type: Fragment,
  props: {
    children: [
      { type: "deployment", props: { apiVersion: "apps/v1", kind: "Deployment", ... } },
      { type: "service", props: { apiVersion: "v1", kind: "Service", ... } },
    ]
  }
}

// ...which renders to:
[
  { apiVersion: "apps/v1", kind: "Deployment", ... },
  { apiVersion: "v1", kind: "Service", ... },
]
```

### Function Components

Components can return single resources or arrays:

```tsx
function Postgres(props) {
  return [
    <statefulset apiVersion="apps/v1" kind="StatefulSet" ... />,
    <service apiVersion="v1" kind="Service" ... />,
    <configmap apiVersion="v1" kind="ConfigMap" ... />,
  ];
}
```

The renderer recursively flattens everything. Your `<App />` can nest `<Database />` and `<Api />`, and you get a flat list of YAML documents.

### Type Safety

All Kubernetes resources are typed from the official OpenAPI spec:

```tsx
import { Deployment, Service, Ingress } from '@reactnetes/k8s-types';

// Full autocomplete and validation
const deployment: Deployment = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: { name: 'myapp' },
  spec: {
    replicas: 3,
    selector: { matchLabels: { app: 'myapp' } },
    template: { ... },
  },
};
```

## CLI

```bash
# Render default entry file (k8s/ReactNetes.tsx)
npx reactnetes render

# Render specific file
npx reactnetes render --entry ./infra/manifest.tsx

# Output to file
npx reactnetes render --out ./output/k8s.yaml

# Show help
npx reactnetes render --help
```

## Examples

### Multi-Environment Setup

Share components between staging and production:

```tsx
// k8s/components/shared.tsx
export function WebApp(props: { name: string; replicas: number; env: string }) {
  return (
    <>
      <deployment apiVersion="apps/v1" kind="Deployment" ... />
      <service apiVersion="v1" kind="Service" ... />
    </>
  );
}

// k8s/overlays/staging/ReactNetes.tsx
import { WebApp } from '../../components/shared';
export default () => <WebApp name="app" replicas={1} env="staging" />;

// k8s/overlays/production/ReactNetes.tsx
import { WebApp } from '../../components/shared';
export default () => <WebApp name="app" replicas={5} env="production" />;
```

### Microservices Platform

Platform team provides shared library, teams consume it:

```tsx
// Platform team's library
export function PublicService(props: ServiceProps) { ... }
export function InternalService(props: InternalServiceProps) { ... }

// Team's app
import { PublicService, InternalService } from './shared/platform';

export default () => (
  <>
    <PublicService name="api-gateway" domain="api.example.com" ... />
    <InternalService name="user-service" allowedClients={['api-gateway']} ... />
  </>
);
```

### Golden Path Template

Standardized template with sensible defaults:

```tsx
// Platform team's template
export function StandardWebApp(props: { name: string; image: string; domain: string }) {
  return (
    <>
      <Postgres name={`${props.name}-db`} ... />
      <deployment ... />  // With monitoring, tracing, health checks
      <service ... />
      <CustomIngress ... />
    </>
  );
}

// Team just fills in the blanks
export default () => (
  <StandardWebApp
    name="ecommerce"
    image="ecommerce/shop:v3.2.1"
    domain="shop.example.com"
  />
);
```

See the [`examples/`](./examples) directory for complete working examples.

## GitHub Actions

ReactNetes includes a GitHub Actions workflow that automatically renders your Kubernetes manifests on every push. When you run `reactnetes init`, it creates `.github/workflows/render.yaml`:

```yaml
name: Render Kubernetes Manifests

on:
  push:
    branches: [main, master]
    paths:
      - 'k8s/**'

jobs:
  render:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npx reactnetes render --out k8s/manifest.yaml

      - name: Commit rendered manifests
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add k8s/manifest.yaml
          git diff --quiet && git diff --staged --quiet || \
            (git commit -m "chore: render kubernetes manifests [skip ci]" && git push)
```

### How it works

1. You edit `k8s/ReactNetes.tsx` and push to `main`
2. GitHub Actions renders the TSX to `k8s/manifest.yaml`
3. The rendered YAML is committed back to the repo
4. Your GitOps tool (Flux, ArgoCD) picks up the YAML and applies it

### GitOps Integration

```
┌─────────────┐     push      ┌──────────────┐     render      ┌─────────────┐
│  Developer  │ ──────────────→ │  GitHub Repo │ ──────────────→ │  manifest   │
│             │               │              │                 │   .yaml     │
└─────────────┘               └──────────────┘                 └──────┬──────┘
                                                                        │
                                                                        │ sync
                                                                        ▼
                                                               ┌──────────────┐
                                                               │   FluxCD /   │
                                                               │   ArgoCD     │
                                                               └──────┬───────┘
                                                                      │
                                                                      ▼
                                                               ┌──────────────┐
                                                               │  Kubernetes  │
                                                               │   Cluster    │
                                                               └──────────────┘
```

## Comparison

| | Raw YAML | Helm | Kustomize | Pulumi | **ReactNetes** |
|:---|:---|:---|:---|:---|:---|
| **Composition** | ❌ Copy-paste | ⚠️ Templates | ❌ Patches only | ✅ Code | ✅ **Components** |
| **Type Safety** | ❌ | ❌ | ❌ | ✅ | ✅ **Full TS** |
| **DRY** | ❌ | ⚠️ Values files | ⚠️ Bases | ✅ | ✅ **Import & reuse** |
| **Learning Curve** | Low | Medium | Low | High | **Low** |
| **Output** | YAML | YAML | YAML | Direct API | **YAML** |
| **GitOps Friendly** | ✅ | ✅ | ✅ | ⚠️ | ✅ **Yes** |

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Render example app
cd examples/basic-app
npx reactnetes render
```

## Architecture

```
reactnetes/
├── packages/
│   ├── k8s-types/      # TypeScript interfaces from K8s OpenAPI
│   ├── core/           # JSX factory + renderer
│   ├── cli/            # Command-line tool
│   └── recipes/        # Pre-built component library
└── examples/
    └── basic-app/      # Example application
```

## Roadmap

- [x] Auto-generate types from Kubernetes OpenAPI spec
- [x] `reactnetes init` — scaffold new projects
- [x] GitHub Actions workflow for auto-render
- [ ] More recipes: Redis, Kafka, RabbitMQ, S3 buckets
- [ ] `reactnetes search` — search recipe registry
- [ ] Watch mode for development
- [ ] Diff view between renders
- [ ] Helm chart generation from components
- [ ] Plugin system for custom recipes

## License

MIT
