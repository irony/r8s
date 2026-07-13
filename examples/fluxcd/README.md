# ReactNetes + FluxCD Example

Complete GitOps workflow with ReactNetes and FluxCD.

## Files

- `k8s/staging.tsx` — Staging environment components
- `k8s/production.tsx` — Production environment components
- `flux/gitops.yaml` — FluxCD GitRepository and Kustomizations

## Workflow

```
Developer → Git push → GitHub Actions → Render YAML → FluxCD → Cluster
```

## Setup

### 1. Install FluxCD

```bash
flux install
```

### 2. Apply FluxCD configuration

```bash
kubectl apply -f flux/gitops.yaml
```

### 3. Verify

```bash
flux get kustomizations
flux get sources git
```

## Rendering

```bash
# Render staging
npx reactnetes render --entry k8s/staging.tsx --out k8s/staging.yaml

# Render production
npx reactnetes render --entry k8s/production.tsx --out k8s/production.yaml
```

## GitHub Actions

The `.github/workflows/render.yaml` (created by `reactnetes init`) automatically renders on push.

## Multi-Environment Strategy

| | Staging | Production |
|:---|:---|:---|
| **Replicas** | 1 | 5 |
| **Database** | 5Gi | 50Gi |
| **TLS** | Self-signed | Let's Encrypt |
| **Passwords** | Hardcoded | External secret |
| **Promotion** | Auto | Manual (suspend) |

Production Kustomization has `suspend: true` — requires manual promotion after staging validation.
