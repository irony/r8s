import { CodeBlock } from "../../components/CodeBlock";

const projectStructure = `my-project/
├── k8s/
│   ├── r8s.tsx              # Your infrastructure
│   ├── operators/             # Operator definitions
│   │   └── kustomization.yaml
│   └── rendered/              # Generated output
├── .github/
│   └── workflows/
│       └── deploy.yaml
├── package.json
└── tsconfig.json`;

const simpleRender = `// .github/workflows/deploy.yaml
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
      - run: npx r8s render --entry k8s/r8s.tsx --out k8s/rendered/

      - name: Commit rendered manifests
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add k8s/rendered/
          git diff --quiet && git diff --staged --quiet || \\
            (git commit -m "chore: render manifests [skip ci]" && git push)`;

const fluxGitRepo = `apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/your-org/my-app
  ref:
    branch: main`;

const fluxKustomization = `apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 10m
  path: ./k8s/rendered
  sourceRef:
    kind: GitRepository
    name: my-app
  prune: true
  wait: true`;

const operatorHelm = `apiVersion: source.toolkit.fluxcd.io/v1beta2
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
  path: ./k8s/rendered
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

const renderMultiEnv = `// package.json
{
  "scripts": {
    "render:staging": "r8s render --entry k8s/overlays/staging/r8s.tsx --out k8s/rendered/staging/",
    "render:production": "r8s render --entry k8s/overlays/production/r8s.tsx --out k8s/rendered/production/",
    "render:all": "npm run render:staging && npm run render:production"
  }
}`;

export default function Page() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl tracking-tight">Deployment</h1>
        <p className="text-xl text-cloud/80">
          Deploy with GitOps. Render once, apply everywhere.
        </p>
      </div>

      {/* Why GitOps */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Why GitOps?</h2>
        <p className="text-cloud/70 leading-relaxed">
          With r8s, your infrastructure is TypeScript code in a Git repository. GitOps tools like FluxCD 
          watch that repository and apply changes automatically. This means your Git history is your 
          deployment history — every change is tracked, reviewed, and reversible.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="p-6 rounded-lg border border-white/10">
            <h3 className="font-serif text-xl mb-3 text-moss">Single Source of Truth</h3>
            <p className="text-cloud/70 text-sm">
              Your Git repository defines the desired state. The cluster converges to match.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-white/10">
            <h3 className="font-serif text-xl mb-3 text-moss">Automatic Sync</h3>
            <p className="text-cloud/70 text-sm">
              Push to main and FluxCD applies changes within minutes. No manual kubectl.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-white/10">
            <h3 className="font-serif text-xl mb-3 text-moss">Drift Detection</h3>
            <p className="text-cloud/70 text-sm">
              Someone changed something manually? FluxCD reverts it back to Git state.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-white/10">
            <h3 className="font-serif text-xl mb-3 text-moss">Rollback</h3>
            <p className="text-cloud/70 text-sm">
              Bad deployment? Revert the Git commit and FluxCD rolls back automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Project Structure */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Project Structure</h2>
        <p className="text-cloud/70">
          Keep your infrastructure, operators, and rendered output together:
        </p>
        <CodeBlock code={projectStructure} language="bash" />
      </div>

      {/* Simple Render */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Render on Every Push</h2>
        <p className="text-cloud/70">
          Start simple: render your TSX to YAML on every push using GitHub Actions:
        </p>
        <CodeBlock code={simpleRender} language="yaml" />
      </div>

      {/* FluxCD Basics */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">FluxCD Setup</h2>
        <p className="text-cloud/70">
          Tell FluxCD where your repository is and what to apply:
        </p>
        
        <div className="space-y-4">
          <h3 className="text-xl">1. Git Repository Source</h3>
          <CodeBlock code={fluxGitRepo} language="yaml" />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl">2. Kustomization</h3>
          <CodeBlock code={fluxKustomization} language="yaml" />
        </div>
      </div>

      {/* Operators */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Install Operators Automatically</h2>
        <p className="text-cloud/70">
          r8s components declare their operator dependencies. Install them automatically with FluxCD's Helm controller:
        </p>
        <CodeBlock code={operatorHelm} language="yaml" />
        
        <div className="p-6 rounded-lg border border-moss/30 bg-moss/5">
          <p className="text-cloud/80">
            <strong className="text-moss">How it works:</strong>{" "}
            When you render your TSX, r8s returns a list of required operators. 
            Create a HelmRelease for each operator in your <code>k8s/operators/</code> folder. 
            FluxCD installs them before applying your application resources.
          </p>
        </div>
      </div>

      {/* Dependency Wait */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Wait for Dependencies</h2>
        <p className="text-cloud/70">
          Ensure operators are ready before applying your resources. Use FluxCD's <code>dependsOn</code>:
        </p>
        <CodeBlock code={dependencyWait} language="yaml" />
        
        <p className="text-cloud/70">
          This tells FluxCD: "Don't apply my application until the operators Kustomization is ready."
        </p>
      </div>

      {/* Multi-Environment */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Multi-Environment Setup</h2>
        <p className="text-cloud/70">
          Use the same components with different props for staging and production:
        </p>
        <CodeBlock code={multiEnv} language="tsx" />
        <CodeBlock code={renderMultiEnv} language="json" />
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
