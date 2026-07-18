import { CodeBlock } from "../../components/CodeBlock";

const projectStructure = `my-project/
├── k8s/
│   ├── r8s.tsx              # Your infrastructure
│   └── package.json         # With @r8s/* dependencies
├── .github/
│   └── workflows/
│       └── deploy.yaml      # Optional: pre-render in CI
├── package.json
└── tsconfig.json`;

const r8sTsx = `// k8s/r8s.tsx
import { App } from '@r8s/recipes';

export default (
  <App
    name="api"
    image="myapp/api:v1.2.3"
    host="api.example.com"
    replicas={3}
    database={{ name: "app-db", storage: "10Gi" }}
    tls={{ issuer: "letsencrypt" }}
    resources={{
      requests: { cpu: "100m", memory: "128Mi" },
      limits: { cpu: "500m", memory: "512Mi" },
    }}
  />
);`;

const fluxBootstrap = `# If you haven't bootstrapped Flux yet:
# https://fluxcd.io/flux/installation/bootstrap/github/

flux bootstrap github \\
  --owner=your-org \\
  --repository=my-project \\
  --branch=main \\
  --path=./clusters/production \\
  --personal`;

const installController = `# Install r8s-controller as init container in Flux
kubectl apply -f https://raw.githubusercontent.com/irony/r8s/main/packages/flux-controller/deploy.yaml`;

const gitRepo = `apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/your-org/my-project
  ref:
    branch: main`;

const kustomization = `apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 10m
  path: ./rendered
  sourceRef:
    kind: GitRepository
    name: my-app
  prune: true
  wait: true`;

const operatorsKustomization = `apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: operators
  namespace: flux-system
spec:
  interval: 1h
  path: ./k8s/operators
  sourceRef:
    kind: GitRepository
    name: my-app
  prune: true`;

const operatorHelm = `# k8s/operators/cnpg.yaml
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: HelmRepository
metadata:
  name: cnpg
  namespace: flux-system
spec:
  interval: 1h
  url: https://cloudnative-pg.github.io/charts
---
apiVersion: helm.toolkit.fluxcd.io/v2beta1
kind: HelmRelease
metadata:
  name: cnpg
  namespace: cnpg-system
spec:
  interval: 1h
  chart:
    spec:
      chart: cloudnative-pg
      version: "0.20.0"
      sourceRef:
        kind: HelmRepository
        name: cnpg
        namespace: flux-system
  install:
    createNamespace: true`;

const dependencyWait = `apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 10m
  path: ./rendered
  sourceRef:
    kind: GitRepository
    name: my-app
  prune: true
  wait: true
  dependsOn:
    - name: operators
      namespace: flux-system`;

const multiEnv = `// k8s/overlays/staging/r8s.tsx
import { App } from '@r8s/recipes';

export default (
  <App
    name="myapp-staging"
    image="myapp/api:latest"
    host="staging.example.com"
    replicas={1}
    database={{ name: "staging-db", storage: "5Gi" }}
    env={{
      NODE_ENV: "staging",
      DEBUG: "true",
    }}
  />
);

// k8s/overlays/production/r8s.tsx
import { App } from '@r8s/recipes';

export default (
  <App
    name="myapp"
    image="myapp/api:v1.2.3"
    host="api.example.com"
    replicas={3}
    database={{ name: "app-db", storage: "20Gi" }}
    tls={{ issuer: "letsencrypt" }}
    resources={{
      requests: { cpu: "100m", memory: "128Mi" },
      limits: { cpu: "500m", memory: "512Mi" },
    }}
  />
);`;

const ciRender = `# Optional: Pre-render in CI instead of in-cluster
# .github/workflows/deploy.yaml
name: Render & Deploy

on:
  push:
    branches: [main]
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
      - run: npx r8s-controller --source=./k8s --output=./rendered

      - name: Commit rendered manifests
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add rendered/
          git diff --quiet && git diff --staged --quiet || \\
            (git commit -m "chore: render manifests [skip ci]" && git push)`;

export default function Page() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl tracking-tight">Deployment</h1>
        <p className="text-xl text-cloud/80">
          Deploy with GitOps. No CI build step needed — render in-cluster.
        </p>
      </div>

      {/* Why r8s-controller */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Why In-Cluster Rendering?</h2>
        <p className="text-cloud/70 leading-relaxed">
          With r8s-controller, your TSX files are rendered directly in the cluster. 
          No need to commit generated YAML to Git. Your repository stays clean — only 
          TypeScript source code, no rendered artifacts.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="p-6 rounded-lg border border-white/10">
            <h3 className="font-serif text-xl mb-3 text-moss">No CI Build Step</h3>
            <p className="text-cloud/70 text-sm">
              Rendering happens in-cluster via init container. 
              Push TSX, get YAML applied automatically.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-white/10">
            <h3 className="font-serif text-xl mb-3 text-moss">Git Stays Clean</h3>
            <p className="text-cloud/70 text-sm">
              Only source code in Git. No generated YAML files 
              cluttering your repository.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-white/10">
            <h3 className="font-serif text-xl mb-3 text-moss">Automatic Updates</h3>
            <p className="text-cloud/70 text-sm">
              Flux watches your git repo and re-renders on every push. 
              No manual steps.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-white/10">
            <h3 className="font-serif text-xl mb-3 text-moss">Type Safety</h3>
            <p className="text-cloud/70 text-sm">
              Catch errors at render time, not deploy time. 
              Invalid TSX fails before reaching Kubernetes.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">How It Works</h2>
        <div className="p-6 rounded-lg border border-white/10 bg-spruce/20">
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-4">
              <span className="text-moss font-mono">1. Git</span>
              <span className="text-cloud/40">→</span>
              <span className="text-cloud/70">Push r8s.tsx to main</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-moss font-mono">2. Flux</span>
              <span className="text-cloud/40">→</span>
              <span className="text-cloud/70">Detects new commit</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-moss font-mono">3. r8s-controller</span>
              <span className="text-cloud/40">→</span>
              <span className="text-cloud/70">Renders TSX → YAML</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-moss font-mono">4. Kubernetes</span>
              <span className="text-cloud/40">→</span>
              <span className="text-cloud/70">Applies rendered YAML</span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Structure */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Project Structure</h2>
        <p className="text-cloud/70">
          Your repository only needs TSX source files:
        </p>
        <CodeBlock code={projectStructure} language="bash" />
      </div>

      {/* Your Infrastructure */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Your Infrastructure</h2>
        <p className="text-cloud/70">
          Define your infrastructure in <code>k8s/r8s.tsx</code>:
        </p>
        <CodeBlock code={r8sTsx} language="tsx" />
      </div>

      {/* Setup */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Setup</h2>
        
        <div className="space-y-4">
          <h3 className="text-xl">1. Bootstrap Flux (if needed)</h3>
          <p className="text-cloud/70">
            If you haven't already, bootstrap FluxCD to your cluster. 
            See <a href="https://fluxcd.io/flux/installation/bootstrap/github/" className="text-moss hover:text-lichen">Flux Bootstrap Documentation</a>.
          </p>
          <CodeBlock code={fluxBootstrap} language="bash" />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl">2. Install r8s-controller</h3>
          <p className="text-cloud/70">
            Add r8s-controller as an init container to Flux's source-controller:
          </p>
          <CodeBlock code={installController} language="bash" />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl">3. Create GitRepository</h3>
          <p className="text-cloud/70">
            Tell Flux where your repository is:
          </p>
          <CodeBlock code={gitRepo} language="yaml" />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl">4. Create Kustomization</h3>
          <p className="text-cloud/70">
            Tell Flux to apply the rendered output:
          </p>
          <CodeBlock code={kustomization} language="yaml" />
        </div>
      </div>

      {/* Operators */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Install Operators</h2>
        <p className="text-cloud/70">
          r8s components declare their operator dependencies. Create a separate Kustomization 
          for operators that runs before your application:
        </p>
        <CodeBlock code={operatorsKustomization} language="yaml" />
        <CodeBlock code={operatorHelm} language="yaml" />
      </div>

      {/* Dependency Wait */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Wait for Dependencies</h2>
        <p className="text-cloud/70">
          Ensure operators are ready before applying your application:
        </p>
        <CodeBlock code={dependencyWait} language="yaml" />
      </div>

      {/* Multi-Environment */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Multi-Environment</h2>
        <p className="text-cloud/70">
          Use overlays for different environments:
        </p>
        <CodeBlock code={multiEnv} language="tsx" />
      </div>

      {/* Alternative: CI Render */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Alternative: Pre-render in CI</h2>
        <p className="text-cloud/70">
          If you prefer, render in CI and commit the YAML. This works without r8s-controller:
        </p>
        <CodeBlock code={ciRender} language="yaml" />
      </div>

      {/* Next Steps */}
      <div className="p-6 rounded-lg border border-white/10 bg-spruce/20">
        <h2 className="font-serif text-2xl mb-3">Ready to deploy?</h2>
        <p className="text-cloud/70 text-sm leading-relaxed">
          Check out the <a href="/recipes" className="text-moss hover:text-lichen">recipes</a> to find 
          components to deploy, or read about <a href="/operators" className="text-moss hover:text-lichen">operators</a> 
          to understand what needs to be installed first.
        </p>
      </div>
    </div>
  );
}
