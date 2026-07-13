# ReactNetes + FluxCD GitOps Integration

This guide shows how to integrate ReactNetes with FluxCD for a complete GitOps workflow.

## Architecture

```
┌─────────────┐     push      ┌──────────────┐     render      ┌─────────────┐
│  Developer  │ ──────────────→ │  GitHub Repo │ ──────────────→ │  k8s/       │
│             │               │              │                 │ manifest.yaml │
└─────────────┘               └──────────────┘                 └──────┬──────┘
                                                                      │
                                                                      │ FluxCD
                                                                      │ watches
                                                                      ▼
                                                               ┌──────────────┐
                                                               │   FluxCD     │
                                                               │  GitRepository│
                                                               └──────┬───────┘
                                                                      │
                                                                      ▼
                                                               ┌──────────────┐
                                                               │  FluxCD      │
                                                               │ Kustomization │
                                                               └──────┬───────┘
                                                                      │
                                                                      ▼
                                                               ┌──────────────┐
                                                               │  Kubernetes  │
                                                               │   Cluster    │
                                                               └──────────────┘
```

## How It Works

1. **Developer edits** `k8s/ReactNetes.tsx` and pushes to `main`
2. **GitHub Actions** renders the TSX to `k8s/manifest.yaml`
3. **GitHub Actions** commits the rendered YAML back to the repo
4. **FluxCD** detects the change in `k8s/manifest.yaml`
5. **FluxCD** applies the manifests to the cluster

## Setup

### 1. Install FluxCD on your cluster

```bash
flux install
```

### 2. Create a GitRepository source

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/my-org/my-app
  ref:
    branch: main
  secretRef:
    name: github-token
```

### 3. Create a Kustomization

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 10m
  path: ./k8s
  prune: true
  sourceRef:
    kind: GitRepository
    name: my-app
  targetNamespace: default
```

### 4. GitHub Actions Workflow

The `reactnetes init` command already creates this for you:

```yaml
name: Render Kubernetes Manifests

on:
  push:
    branches: [main]
    paths:
      - 'k8s/**'
      - '!k8s/manifest.yaml'  # Don't trigger on rendered output

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

## Directory Structure

```
my-app/
├── .github/
│   └── workflows/
│       └── render.yaml       # Auto-render on push
├── k8s/
│   ├── ReactNetes.tsx        # Your components (source of truth)
│   └── manifest.yaml         # Rendered output (auto-generated)
├── package.json
└── tsconfig.json
```

## Important Notes

### Git Ignore

Add this to `.gitignore`:

```gitignore
# Ignore rendered manifests in PR diffs
# But keep them in the repo for FluxCD
k8s/manifest.yaml
```

Wait — actually, **don't** ignore `manifest.yaml`. FluxCD needs it in the repo. Instead, use `.gitattributes` to hide it from PR diffs:

```gitattributes
k8s/manifest.yaml linguist-generated=true
```

### Prevent Infinite Loops

The GitHub Actions workflow must not trigger itself. The `[skip ci]` in the commit message prevents this.

Also, exclude `k8s/manifest.yaml` from the `paths` trigger:

```yaml
on:
  push:
    paths:
      - 'k8s/**'
      - '!k8s/manifest.yaml'  # Important!
```

## Multi-Environment with FluxCD

For staging and production:

```
my-app/
├── k8s/
│   ├── components/
│   │   └── shared.tsx
│   ├── overlays/
│   │   ├── staging/
│   │   │   └── ReactNetes.tsx
│   │   └── production/
│   │       └── ReactNetes.tsx
│   └── manifest.yaml          # Not used with overlays
├── .github/
│   └── workflows/
│       └── render.yaml
└── flux/
    ├── staging/
    │   └── kustomization.yaml
    └── production/
        └── kustomization.yaml
```

GitHub Actions renders both:

```yaml
- run: npx reactnetes render --entry k8s/overlays/staging/ReactNetes.tsx --out k8s/staging.yaml
- run: npx reactnetes render --entry k8s/overlays/production/ReactNetes.tsx --out k8s/production.yaml
```

FluxCD Kustomizations:

```yaml
# flux/staging/kustomization.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app-staging
  namespace: flux-system
spec:
  interval: 10m
  path: ./k8s/staging.yaml
  # ...

# flux/production/kustomization.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app-production
  namespace: flux-system
spec:
  interval: 10m
  path: ./k8s/production.yaml
  # ...
```

## Benefits

| Feature | Without ReactNetes | With ReactNetes |
|:---|:---|:---|
| **Source of truth** | YAML files | TSX components |
| **Type safety** | ❌ | ✅ |
| **DRY** | Copy-paste YAML | Import & reuse components |
| **Code review** | YAML diffs | Component diffs |
| **GitOps** | Manual or templated | Rendered automatically |
| **Rollback** | Git revert YAML | Git revert TSX |

## Troubleshooting

### "FluxCD not applying changes"

Check that `k8s/manifest.yaml` is committed:

```bash
git log --oneline k8s/manifest.yaml
```

Check FluxCD status:

```bash
flux get kustomizations
flux logs --level=error
```

### "GitHub Actions not triggering"

Ensure the workflow file is on the default branch (`main` or `master`).

### "Rendered YAML is empty"

Check that `k8s/ReactNetes.tsx` exports a default component:

```tsx
export default function App() {
  return (
    <>
      {/* your resources */}
    </>
  );
}
```
