# r8s FluxCD Controller

A FluxCD source controller that renders r8s TSX manifests directly to YAML.

## How It Works

```
Git Repository (.tsx files)
    ↓
Flux GitRepository (clones to /data)
    ↓
r8s-controller (renders TSX → YAML)
    ↓
Flux Kustomization (applies rendered YAML)
    ↓
Kubernetes
```

## Installation

### 1. Install the controller as a Flux Kustomization

```yaml
# flux-system/r8s-controller.yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: r8s-manifests
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/your-org/your-repo
  ref:
    branch: main
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: r8s-rendered
  namespace: flux-system
spec:
  interval: 10m
  path: ./rendered
  prune: true
  sourceRef:
    kind: GitRepository
    name: r8s-manifests
  postBuild:
    substituteFrom:
      - kind: ConfigMap
        name: cluster-vars
```

### 2. Add the r8s-controller as an init container

```yaml
# patch the source-controller deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: source-controller
  namespace: flux-system
spec:
  template:
    spec:
      initContainers:
        - name: r8s-render
          image: ghcr.io/r8s-io/flux-controller:latest
          command:
            - r8s-controller
            - --source=/data
            - --output=/data/rendered
            - --verbose
          volumeMounts:
            - name: data
              mountPath: /data
      containers:
        - name: manager
          volumeMounts:
            - name: data
              mountPath: /data
```

## Repository Structure

Your Git repository should look like this:

```
.
├── apps/
│   ├── web/
│   │   └── r8s.tsx          # Entry file
│   └── api/
│       └── r8s.tsx          # Entry file
├── infrastructure/
│   ├── databases/
│   │   └── r8s.tsx
│   └── ingress/
│       └── r8s.tsx
└── package.json             # With @r8s/* dependencies
```

## Example r8s.tsx

```tsx
import { Database } from '@r8s/recipes';
import { Ingress } from '@r8s/recipes';
import { WebService } from '@r8s/recipes';

export default function WebApp() {
  return (
    <>
      <Database name="web-db" storage="10Gi" />
      <WebService name="web" image="myapp/web:v1" port={3000} />
      <Ingress
        name="web"
        host="app.example.com"
        serviceName="web"
        tls={{ secretName: "web-tls", clusterIssuer: "letsencrypt" }}
      />
    </>
  );
}
```

## Local Development

```bash
# Render locally
npx r8s-controller --source=./k8s --output=./rendered --verbose

# The rendered YAML will be in ./rendered/
ls rendered/
# apps/web/r8s.yaml
# apps/api/r8s.yaml
```

## How It Works with Flux

1. **GitRepository** clones your repo to `/data`
2. **Init container** runs before the source-controller starts
3. **r8s-controller** finds all `r8s.tsx` files and renders them
4. Rendered YAML is written to `/data/rendered/`
5. **Kustomization** reads from `./rendered/` path
6. Kubernetes resources are applied

## Benefits

- **No build step in CI** — rendering happens in-cluster
- **Git is still source of truth** — your `.tsx` files are versioned
- **Automatic updates** — Flux watches git and re-renders on changes
- **Type safety** — catch errors at build time, not deploy time
- **DRY** — reuse components across environments

## Alternative: Pre-render in CI

If you prefer, you can render in CI and commit the YAML:

```yaml
# .github/workflows/render.yml
name: Render r8s manifests
on:
  push:
    paths:
      - '**.tsx'
jobs:
  render:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx r8s-controller --source=./k8s --output=./rendered
      - run: |
          git config user.name "github-actions"
          git config user.email "actions@github.com"
          git add rendered/
          git diff --quiet && git diff --staged --quiet || git commit -m "chore: render r8s manifests"
          git push
```
