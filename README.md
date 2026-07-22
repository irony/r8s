# r8s

**Kubernetes manifests as TSX components.**

Stop writing YAML. Start composing infrastructure.

```tsx
// k8s/r8s.tsx
import { App } from '@r8s/recipes';

export default () => (
  <App
    name="api"
    image="myapp/api:v1.2.3"
    host="api.example.com"
  />
);
```

```bash
$ npx r8s render
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
# ... 3 resources rendered from 1 component
```

> **Batteries included, escape hatches included.** The `<App>` component above creates a Deployment, Service, and Ingress — all wired together with sensible defaults. Prefer raw Kubernetes? Every API resource is available as a lowercase component: `<deployment>`, `<service>`, `<ingress>`, `<configmap>`, `<secret>`, `<statefulset>`, `<daemonset>`, `<job>`, `<cronjob>`, `<hpa>`, `<pdb>`, `<rbac>` — compose them exactly as you need.

## Available Packages

| Package | Description | Operators |
|---------|-------------|-----------|
| `@r8s/core` | JSX factory + all Kubernetes API components (`<deployment>`, `<service>`, `<ingress>`, etc.) | — |
| `@r8s/recipes` | Pre-built components (`<App>`, `<Database>`, `<Ingress>`) | cnpg, nginx-ingress |
| `@r8s/cert-manager` | TLS certificates | cert-manager |
| `@r8s/openbao` | Secret management | vault-secrets-operator |
| `@r8s/keycloak` | Identity management | keycloak-operator |
| `@r8s/external-dns` | DNS management | external-dns |
| `@r8s/redis` | Redis clusters | redis-operator |
| `@r8s/gateway` | Envoy Gateway (Gateway API) | envoy-gateway |
| `@r8s/monitoring` | Prometheus stack | kube-prometheus-stack |
| `@r8s/clickhouse` | ClickHouse database | clickhouse-operator |
| `@r8s/logging` | Log aggregation (Banzai Cloud) | logging-operator |
| `@r8s/loki` | Grafana Loki | loki |
| `@r8s/r8s-controller` | In-cluster TSX rendering controller | — |
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
| Composition | `<Header><Nav /></Header>` | `<App><Api /><Db /></App>` |
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
<App>                      →   ---
  <Database />             →   apiVersion: postgresql.cnpg.io/v1
  <Api />                  →   kind: Cluster
</App>                     →   metadata:
                                 name: api-db
                               ---
                               apiVersion: apps/v1
                               kind: Deployment
                               ...
```

**6. Testable infrastructure**

Because r8s components are just TypeScript functions, you can test them with standard tools like Vitest:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import { App, Database } from '@r8s/recipes';

describe('MyApp', () => {
  it('should create a Deployment with 3 replicas', () => {
    const result = render(
      <App name="api" image="myapp/api:v1" host="api.example.com" replicas={3} />
    );

    const deployment = result.resources.find(r => r.kind === 'Deployment');
    expect(deployment.spec.replicas).toBe(3);
  });

  it('should require CNPG operator when database is used', () => {
    const result = render(<Database name="app-db" storage="10Gi" />);
    expect(result.operators).toHaveLength(1);
    expect(result.operators[0].name).toBe('cnpg');
  });
});
```

This means you can write guardrails — tests that verify your infrastructure meets organizational requirements (network policies, resource limits, label conventions) before anything reaches a cluster.

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
import { App } from '@r8s/recipes';

export default () => (
  <App
    name="myapp"
    namespace="production"
    image="myapp/web:v1.2.3"
    port={3000}
    host="myapp.example.com"
    replicas={3}
    tls={{ secretName: "myapp-tls", clusterIssuer: "letsencrypt" }}
    env={{ LOG_LEVEL: 'info' }}
    secrets={{ DATABASE_URL: 'app-secrets' }}
    resources={{
      requests: { cpu: "100m", memory: "128Mi" },
      limits: { cpu: "500m", memory: "512Mi" },
    }}
  />
);
```

Need something custom? Compose with other components:

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

// All required operators
console.log(result.operators);

// All Kubernetes resources
console.log(result.resources);
```

### Sharing Operators via Context

For a complete stack, provide shared operators via `OperatorContext`:

```tsx
import { OperatorContext } from '@r8s/core/defaults';
import { Database, Ingress, App } from '@r8s/recipes';
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
      <App name="api" host="api.example.com" image="myapp/api:v1" tls={{ secretName: "api-tls", clusterIssuer: "letsencrypt" }} />
    </OperatorContext.Provider>
  );
}
```

When operators are provided via context, components won't duplicate them.

### Available Operators

Each package exports its own operator factory:

```tsx
import { cnpgOperator, nginxIngressOperator } from '@r8s/recipes';
import { certManagerOperator } from '@r8s/cert-manager';
import { externalDNSOperator } from '@r8s/external-dns';
import { vaultSecretsOperator } from '@r8s/openbao';
import { keycloakOperator } from '@r8s/keycloak';
import { envoyGatewayOperator } from '@r8s/gateway';
import { redisOperator } from '@r8s/redis';
import { prometheusOperator } from '@r8s/monitoring';
import { clickhouseOperator } from '@r8s/clickhouse';
import { loggingOperator } from '@r8s/logging';
import { lokiOperator } from '@r8s/loki';

cnpgOperator('1.22.5');          // PostgreSQL operator
nginxIngressOperator('1.15.1');  // Ingress controller
certManagerOperator('1.14.0');   // TLS certificates
externalDNSOperator('0.14.0');   // DNS management
vaultSecretsOperator('0.5.0');   // Secret management
keycloakOperator('24.0.0');      // Identity management
envoyGatewayOperator('1.7.0');   // Gateway API
redisOperator('0.22.0');         // Redis clusters
prometheusOperator('0.72.0');    // Prometheus stack
clickhouseOperator('0.23.0');    // ClickHouse database
loggingOperator('4.2.3');        // Log aggregation
lokiOperator('5.47.0');          // Grafana Loki
```

## Packages & Components

Pre-built components for common infrastructure. Each component declares its operator dependencies automatically (unless provided via `OperatorContext`).

### Core Recipes (`@r8s/recipes`)

#### `<Database />`

Creates: CloudNativePG Cluster (3-instance HA)

```tsx
import { Database } from '@r8s/recipes';

<Database
  name="api-db"
  namespace="production"
  storage="20Gi"
/>
```

**Automatically declares:** `cnpg` operator

#### `<Cluster />`

Creates: Shared PostgreSQL cluster for multiple databases. Wrap `<Database />` children to share one CNPG cluster.

```tsx
import { Cluster, Database } from '@r8s/recipes';

<Cluster name="main" storage="100Gi">
  <Database name="user-db" />
  <Database name="order-db" />
</Cluster>
```

**Automatically declares:** `cnpg` operator

#### `<Postgres />`

Creates: Advanced CNPG cluster with optional Pooler and ScheduledBackup. Useful when you need connection pooling or scheduled backups.

```tsx
import { Postgres } from '@r8s/recipes';

<Postgres
  name="analytics-db"
  storage="50Gi"
  instances={3}
  enablePooler
  enableBackup
  backupSchedule="0 2 * * *"
/>
```

**Automatically declares:** `cnpg` operator

#### `<WebService />`

Creates: Deployment + Service with health checks, plain/Vault/Secret env wiring, and auto DATABASE_URL when composed inside a database context.

```tsx
import { WebService } from '@r8s/recipes';

<WebService
  name="api"
  image="myapp/api:v1"
  port={3000}
  replicas={2}
  env={{ LOG_LEVEL: 'info' }}
  secrets={{ DATABASE_URL: 'app-secrets' }}
/>
```

**Automatically declares:** `vault-secrets-operator` (when `vault` props are used)

#### `<Ingress />`

Creates: Ingress with nginx + cert-manager defaults

```tsx
import { Ingress } from '@r8s/recipes';

<Ingress
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

**Automatically declares:** `nginx-ingress` operator, `cert-manager` operator (when TLS enabled)

#### `<App />`

Creates: WebService (Deployment + Service) + Ingress. Compose with `<Database />` for a full stack.

```tsx
import { App } from '@r8s/recipes';

<App
  name="myapp"
  host="myapp.example.com"
  image="mycompany/myapp:v1.2.3"
  port={3000}
  replicas={3}
  tls={{ secretName: "myapp-tls", clusterIssuer: "letsencrypt" }}
/>
```

To add a database, compose `<App />` with `<Database />`:

```tsx
import { App, Database } from '@r8s/recipes';

<>
  <Database name="myapp-db" storage="20Gi" />
  <App
    name="myapp"
    host="myapp.example.com"
    image="mycompany/myapp:v1.2.3"
    tls={{ secretName: "myapp-tls", clusterIssuer: "letsencrypt" }}
  />
</>
```

**Automatically declares:** `nginx-ingress`, `cert-manager` operators (the latter only when TLS is enabled).

> **Note:** `cnpg` is declared automatically when a `<Database />` component is composed inside or alongside `<App />`, not by `<App />` itself.

### Databases

#### `<RedisCluster />` (`@r8s/redis`)

Creates: Redis Cluster (OT-Container-Kit) with configurable cluster size and persistence.

```tsx
import { RedisCluster } from '@r8s/redis';

<RedisCluster
  name="cache"
  namespace="production"
  clusterSize={3}
  storage="10Gi"
/>
```

**Automatically declares:** `redis-operator`

#### `<ClickHouseCluster />` (`@r8s/clickhouse`)

Creates: ClickHouseInstallation with sharding/replication layout, users, and profiles.

```tsx
import { ClickHouseCluster } from '@r8s/clickhouse';

<ClickHouseCluster
  name="analytics"
  namespace="production"
  cluster={{ layout: { shardsCount: 2, replicasCount: 2 } }}
/>
```

**Automatically declares:** `clickhouse-operator`

### Networking & Routing

#### `<Gateway />` (`@r8s/gateway`)

Creates: Gateway API Gateway resource with HTTPS listeners.

```tsx
import { Gateway } from '@r8s/gateway';

<Gateway
  name="public-gateway"
  gatewayClassName="eg"
  listeners={[
    { name: 'https', protocol: 'HTTPS', port: 443, hostname: 'api.example.com' },
  ]}
/>
```

**Automatically declares:** `envoy-gateway`

#### `<HTTPRoute />` (`@r8s/gateway`)

Creates: Gateway API HTTPRoute for routing traffic to backends with path/header matches.

```tsx
import { HTTPRoute } from '@r8s/gateway';

<HTTPRoute
  name="api-route"
  parentRefs={[{ name: 'public-gateway' }]}
  hostnames={['api.example.com']}
  rules={[{ backendRefs: [{ name: 'api', port: 80 }] }]}
/>
```

#### `<ExternalDNSRecord />` (`@r8s/external-dns`)

Creates: DNSEndpoint CRD for external-dns. Use `externalDNSAnnotations()` to annotate ingresses.

```tsx
import { ExternalDNSRecord } from '@r8s/external-dns';

<ExternalDNSRecord
  name="api-dns"
  dnsName="api.example.com"
  targets={['1.2.3.4']}
  recordType="A"
  ttl={300}
/>
```

### Security & Identity

#### `<ManagedCertificate />` (`@r8s/cert-manager`)

Creates: cert-manager Certificate for automated TLS issuance and renewal.

```tsx
import { ManagedCertificate } from '@r8s/cert-manager';

<ManagedCertificate
  name="api-cert"
  secretName="api-tls"
  issuerName="letsencrypt"
  dnsNames={['api.example.com']}
/>
```

#### `<LetsEncryptIssuer />` (`@r8s/cert-manager`)

Creates: Let's Encrypt ClusterIssuer (HTTP-01 via nginx by default, staging or production server).

```tsx
import { LetsEncryptIssuer } from '@r8s/cert-manager';

<LetsEncryptIssuer
  name="letsencrypt"
  email="admin@example.com"
  server="production"
/>
```

#### `<VaultKVSecret />` (`@r8s/openbao`)

Creates: VaultStaticSecret CRD, projecting a Vault KV path to a Kubernetes Secret.

```tsx
import { VaultKVSecret } from '@r8s/openbao';

<VaultKVSecret
  name="db-creds"
  namespace="production"
  vaultAuthRef="default"
  mount="kv"
  path="db/credentials"
  secretName="db-creds"
/>
```

**Automatically declares:** `vault-secrets-operator`

#### `<KeycloakInstance />` (`@r8s/keycloak`)

Creates: Keycloak CR (k8s.keycloak.org/v2alpha1). Auto-wires database when nested in a `<Database />` or via explicit `dbHost`.

```tsx
import { KeycloakInstance } from '@r8s/keycloak';

<KeycloakInstance
  name="keycloak"
  hostname="auth.example.com"
  instances={2}
  tlsSecretName="keycloak-tls"
/>
```

**Automatically declares:** `keycloak-operator` (via OLM)

#### `<KeycloakRealm />` (`@r8s/keycloak`)

Creates: KeycloakRealmImport CR for seeding clients and users into a realm.

```tsx
import { KeycloakRealm } from '@r8s/keycloak';

<KeycloakRealm
  name="my-realm"
  namespace="production"
  keycloakName="keycloak"
  realmName="my-app"
  clients={[{ clientId: 'web', redirectUris: ['https://app.example.com/*'] }]}
/>
```

### Observability

#### `<ServiceMonitor />` (`@r8s/monitoring`)

Creates: Prometheus ServiceMonitor for scraping service metrics.

```tsx
import { ServiceMonitor } from '@r8s/monitoring';

<ServiceMonitor
  name="api-metrics"
  selector={{ matchLabels: { app: 'api' } }}
  endpoints={[{ port: 'metrics', path: '/metrics' }]}
/>
```

**Automatically declares:** `prometheus` (kube-prometheus-stack)

#### `<Logging />` (`@r8s/logging`)

Creates: Banzai Cloud Logging stack. Compose with `<Flow />` and `<Output />` to route logs.

```tsx
import { Logging } from '@r8s/logging';

<Logging
  name="platform-logs"
  namespace="logging"
  fluentd={{ replicas: 2 }}
/>
```

**Automatically declares:** `logging-operator`

#### `<LokiStack />` (`@r8s/loki`)

Creates: Grafana Loki stack with S3/GCS/filesystem storage and retention limits.

```tsx
import { LokiStack } from '@r8s/loki';

<LokiStack
  name="loki"
  namespace="loki"
  storage={{ type: 's3', bucket: 'my-loki-bucket', region: 'eu-north-1' }}
  limits={{ retention: { period: '30d' } }}
/>
```

**Automatically declares:** `loki`

## How It Works

### JSX Without React

r8s provides its own lightweight JSX factory. No React dependency, no virtual DOM — just a tree that flattens to Kubernetes resources:

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

Components can return single resources, arrays, or operator declarations:

```tsx
function Database(props) {
  return [
    declareOperator(cnpgOperator('1.22.5')),
    <Cluster apiVersion="postgresql.cnpg.io/v1" kind="Cluster" ... />,
  ];
}
```

The renderer recursively flattens everything and collects operators. Your `<App />` can nest `<Database />` and `<Api />`, and you get a flat list of YAML documents plus all required operators.

### Context System

r8s includes a React-like context system for sharing configuration:

```tsx
import { Namespace, Labels, OperatorContext } from '@r8s/core/defaults';
import { cnpgOperator } from '@r8s/recipes';
import { certManagerOperator } from '@r8s/cert-manager';

export default function Platform() {
  return (
    <Namespace.Provider value="production">
      <Labels.Provider value={{ app: 'myapp', team: 'platform' }}>
        <OperatorContext.Provider value={[
          cnpgOperator('1.22.5'),
          certManagerOperator('1.14.0'),
        ]}>
          <Database name="app-db" storage="10Gi" />
          <App name="api" host="api.example.com" image="myapp/api:v1" tls={{ secretName: "api-tls", clusterIssuer: "letsencrypt" }} />
        </OperatorContext.Provider>
      </Labels.Provider>
    </Namespace.Provider>
  );
}
```

### Type Safety

All Kubernetes resources are typed from the official OpenAPI spec:

```tsx
import { Deployment, Service, Ingress } from '@r8s/k8s-types';

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
# Render default entry file (k8s/r8s.tsx)
npx r8s render

# Render specific file
npx r8s render --entry ./infra/manifest.tsx

# Output to file
npx r8s render --out ./output/k8s.yaml

# Show help
npx r8s render --help
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

// k8s/overlays/staging/r8s.tsx
import { WebApp } from '../../components/shared';
export default () => <WebApp name="app" replicas={1} env="staging" />;

// k8s/overlays/production/r8s.tsx
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
      <Database name={`${props.name}-db`} ... />
      <deployment ... />  // With monitoring, tracing, health checks
      <service ... />
      <Ingress ... />
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

## Validation

r8s includes built-in validation with helpful error messages:

```tsx
import { render, validateResource, checkDuplicates } from '@r8s/core';

const result = render(<MyApp />);

// Validate all resources
const errors = result.resources.flatMap(validateResource);
const duplicates = checkDuplicates(result.resources);

if (errors.length > 0) {
  console.error(errors[0].message);      // "Ingress 'api' is missing spec.rules"
  console.error(errors[0].suggestion);   // "Add at least one rule with host and backend service"
}
```

**Validators:** `validateResource`, `validateIngress`, `validateService`, `validateDeployment`, `validateOperator`, `checkDuplicates`

**Error format:** `{ code, message, resource, field, suggestion }`

## FluxCD Integration

### Option 1: r8s-controller (in-cluster rendering)

Push `.tsx` files directly to git — no CI build step needed:

```yaml
# Flux GitRepository clones your repo
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: r8s-manifests
spec:
  interval: 1m
  url: https://github.com/your-org/your-repo
---
# r8s-controller renders TSX → YAML as init container
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: r8s-rendered
spec:
  path: ./rendered
  sourceRef:
    kind: GitRepository
    name: r8s-manifests
```

### Option 2: Webhooks (instant sync)

Get instant reconciliation when you push:

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1
kind: Receiver
metadata:
  name: r8s-github-webhook
spec:
  type: github
  events: [push]
  secretRef:
    name: r8s-webhook-token
  resources:
    - apiVersion: source.toolkit.fluxcd.io/v1
      kind: GitRepository
      name: r8s-manifests
```

See [`packages/flux-controller/`](./packages/flux-controller) for complete setup.

## GitHub Actions

r8s includes a GitHub Actions workflow that automatically renders your Kubernetes manifests on every push. When you run `r8s init`, it creates `.github/workflows/render.yaml`:

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
      - run: npx r8s render --out k8s/manifest.yaml

      - name: Commit rendered manifests
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add k8s/manifest.yaml
          git diff --quiet && git diff --staged --quiet || \
            (git commit -m "chore: render kubernetes manifests [skip ci]" && git push)
```

### How it works

1. You edit `k8s/r8s.tsx` and push to `main`
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

| | Raw YAML | Helm | Kustomize | Pulumi | **r8s** |
|:---|:---|:---|:---|:---|:---|
| **Composition** | ❌ Copy-paste | ⚠️ Templates | ❌ Patches only | ✅ Code | ✅ **Components** |
| **Type Safety** | ❌ | ❌ | ❌ | ✅ | ✅ **Full TS** |
| **DRY** | ❌ | ⚠️ Values files | ⚠️ Bases | ✅ | ✅ **Import & reuse** |
| **Operator Tracking** | ❌ | ⚠️ Subcharts | ❌ | ✅ | ✅ **Explicit deps** |
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
npx r8s render
```

## Architecture

```
r8s/
├── packages/
│   ├── cert-manager/       # TLS certificate components
│   ├── clickhouse/         # ClickHouse Operator components
│   ├── cli/                # Command-line tool
│   ├── core/               # JSX factory, renderer, context, validation
│   ├── external-dns/       # DNS management components
│   ├── flux-controller/    # FluxCD source controller for in-cluster rendering
│   ├── gateway/            # Envoy Gateway (Gateway API) components
│   ├── k8s-types/          # TypeScript interfaces + shared routing abstractions
│   ├── keycloak/           # Identity management components
│   ├── logging/            # Logging Operator components
│   ├── loki/               # Grafana Loki components
│   ├── monitoring/         # Prometheus stack components
│   ├── openbao/            # Secret management components
│   ├── r8s-controller/     # In-cluster TSX rendering controller
│   ├── recipes/            # Pre-built components (Database, Ingress, App)
│   └── redis/              # Redis Operator components
├── examples/
│   ├── basic-app/          # Simple app + database
│   ├── simple-app/         # One-liner App component
│   ├── operators-demo/     # Platform with Vault, Keycloak, cert-manager
│   ├── microservices/      # E-commerce platform
│   └── fluxcd/             # Staging + production overlays
└── docs/                   # Documentation site (Vike + React)
```

## Roadmap

- [x] Auto-generate types from Kubernetes OpenAPI spec
- [x] `r8s init` — scaffold new projects
- [x] GitHub Actions workflow for auto-render
- [x] **Operator dependency tracking** — explicit, type-safe operator declarations
- [x] **Context system** — Namespace, Labels, OperatorContext for composition
- [x] **Package-local operators** — each package exports its own operator
- [x] **Shared routing interfaces** — RouteTarget, TLSConfig, BaseRouteProps
- [x] **Validation** — helpful error messages with suggestions
- [x] **FluxCD controller** — in-cluster TSX rendering
- [x] **FluxCD webhooks** — instant sync on git push
- [x] **New operators** — Redis, Gateway, Monitoring, ClickHouse, Logging, Loki
- [ ] Watch mode for development
- [ ] Diff view between renders
- [ ] Helm chart generation from components
- [ ] Plugin system for custom recipes

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
