# r8s Examples

This directory contains example projects demonstrating different r8s patterns.

## Examples

### 1. Basic App (`basic-app/`)

Simple single-application setup with a web app and database.

```bash
cd basic-app
npx r8s render
```

**Demonstrates:**
- Basic JSX syntax with `<>` and `</>`
- Using recipes (`<Postgres />`, `<CustomIngress />`)
- Raw Kubernetes resources (`<deployment>`, `<service>`)

### 2. Multi-Environment (`multi-env/`)

Shared components used across staging and production environments.

```bash
cd multi-env

# Render staging
npx r8s render --entry k8s/overlays/staging/r8s.tsx

# Render production
npx r8s render --entry k8s/overlays/production/r8s.tsx
```

**Demonstrates:**
- Shared component library (`k8s/components/shared.tsx`)
- Environment-specific overlays
- Conditional resources (HPA only in production)
- Different resource sizes per environment

### 3. Microservices (`microservices/`)

Platform team's shared library with public and internal services.

```bash
cd microservices
npx r8s render
```

**Demonstrates:**
- Platform team's shared library (`k8s/shared/platform.tsx`)
- `<PublicService>` — exposed via Ingress with rate limiting
- `<InternalService>` — protected by NetworkPolicy
- Standardized health checks and observability

### 4. Blueprint/Template (`blueprint/`)

"Golden Path" template that teams can reuse.

```bash
cd blueprint

# Render ecommerce app
npx r8s render --entry k8s/apps/ecommerce.tsx

# Render analytics app
npx r8s render --entry k8s/apps/analytics.tsx
```

**Demonstrates:**
- Standardized template with sensible defaults
- Teams only specify name, image, and domain
- Platform team controls: monitoring, tracing, PDB, resource limits
- Easy to onboard new services

## Running Examples

All examples can be rendered with the CLI:

```bash
# From the example directory
npx r8s render

# Or specify entry file
npx r8s render --entry k8s/overlays/production/r8s.tsx

# Output to file
npx r8s render --out manifest.yaml
```
