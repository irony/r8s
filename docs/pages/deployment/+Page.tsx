import { useState } from 'react';
import { CodeBlock } from "../../components/CodeBlock";

const projectStructure = `my-project/
├── k8s/
│   └── r8s.tsx          # Your entire infrastructure
├── .github/
│   └── workflows/
│       └── deploy.yaml  # Optional: GitHub Actions
└── package.json`;

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
  />
);`;

const githubActions = `name: Render & Deploy

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
  url: https://github.com/your-org/my-project
  ref:
    branch: main`;

const fluxKustomization = `apiVersion: kustomize.toolkit.fluxcd.io/v1
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

const renderedOutput = `# Operator: cnpg v1.22.5
apiVersion: v1
kind: Namespace
metadata:
  name: cnpg-system
---
# Operator: cert-manager v1.14.0
apiVersion: v1
kind: Namespace
metadata:
  name: cert-manager
---
# Your resources
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
# ...`;

const multiEnv = `// k8s/overlays/staging/r8s.tsx
import { App } from '@r8s/recipes';

export default (
  <App
    name="myapp-staging"
    image="myapp/api:latest"
    host="staging.example.com"
    replicas={1}
    database={{ name: "staging-db", storage: "5Gi" }}
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
  />
);`;

export default function Page() {
  const [strategy, setStrategy] = useState<'github' | 'flux'>('flux');

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl tracking-tight">Deployment</h1>
        <p className="text-xl text-cloud/80">
          One file. Everything included. Operators are fetched automatically.
        </p>
      </div>

      {/* Strategy Switch */}
      <div className="flex rounded-lg border border-white/10 overflow-hidden">
        <button
          onClick={() => setStrategy('github')}
          className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
            strategy === 'github'
              ? 'bg-moss/20 text-moss border-b-2 border-moss'
              : 'text-cloud/60 hover:text-cloud/80'
          }`}
        >
          <div className="font-bold">GitHub Actions</div>
          <div className="text-xs mt-1 opacity-70">Pre-render in CI</div>
        </button>
        <button
          onClick={() => setStrategy('flux')}
          className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
            strategy === 'flux'
              ? 'bg-moss/20 text-moss border-b-2 border-moss'
              : 'text-cloud/60 hover:text-cloud/80'
          }`}
        >
          <div className="font-bold">FluxCD + r8s-controller</div>
          <div className="text-xs mt-1 opacity-70">Render in-cluster (recommended)</div>
        </button>
      </div>

      {/* GitHub Actions Strategy */}
      {strategy === 'github' && (
        <div className="space-y-12">
          <div className="p-6 rounded-lg border border-white/10 bg-spruce/20">
            <h3 className="font-serif text-xl mb-3">GitHub Actions</h3>
            <p className="text-cloud/70 text-sm">
              Render TSX to YAML in CI. Operators are fetched and included automatically.
              Commit the output — your GitOps tool applies everything.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl tracking-tight">How It Works</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-4">
                <span className="text-moss font-mono">1. Push</span>
                <span className="text-cloud/40">→</span>
                <span className="text-cloud/70">Push r8s.tsx to main</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-moss font-mono">2. Render</span>
                <span className="text-cloud/40">→</span>
                <span className="text-cloud/70">CI renders TSX → YAML, fetches operators</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-moss font-mono">3. Commit</span>
                <span className="text-cloud/40">→</span>
                <span className="text-cloud/70">Rendered YAML (with operators) committed back</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-moss font-mono">4. Apply</span>
                <span className="text-cloud/40">→</span>
                <span className="text-cloud/70">GitOps tool applies everything to cluster</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl tracking-tight">GitHub Actions Workflow</h2>
            <CodeBlock code={githubActions} language="yaml" />
          </div>
        </div>
      )}

      {/* FluxCD Strategy */}
      {strategy === 'flux' && (
        <div className="space-y-12">
          <div className="p-6 rounded-lg border border-moss/30 bg-moss/5">
            <h3 className="font-serif text-xl mb-3 text-moss">FluxCD + r8s-controller (Recommended)</h3>
            <p className="text-cloud/70 text-sm">
              Render TSX directly in the cluster. No CI build step. Your repo stays clean 
              — just TypeScript source code. Operators are fetched and included automatically.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl tracking-tight">How It Works</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-4">
                <span className="text-moss font-mono">1. Push</span>
                <span className="text-cloud/40">→</span>
                <span className="text-cloud/70">Push r8s.tsx to main</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-moss font-mono">2. Clone</span>
                <span className="text-cloud/40">→</span>
                <span className="text-cloud/70">Flux clones repo to cluster</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-moss font-mono">3. Render</span>
                <span className="text-cloud/40">→</span>
                <span className="text-cloud/70">r8s-controller renders TSX → YAML, fetches operators</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-moss font-mono">4. Apply</span>
                <span className="text-cloud/40">→</span>
                <span className="text-cloud/70">Flux applies everything — resources + operators</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl tracking-tight">Setup</h2>
            
            <div className="space-y-4">
              <h3 className="text-xl">1. Bootstrap Flux</h3>
              <p className="text-cloud/70">
                If you haven't already, bootstrap FluxCD. See{" "}
                <a href="https://fluxcd.io/flux/installation/bootstrap/github/" className="text-moss hover:text-lichen">Flux Bootstrap Docs</a>.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl">2. Install r8s-controller</h3>
              <p className="text-cloud/70">
                Add r8s-controller as init container to Flux's source-controller:
              </p>
              <CodeBlock code={`kubectl apply -f https://raw.githubusercontent.com/irony/r8s/main/packages/flux-controller/deploy.yaml`} language="bash" />
            </div>

            <div className="space-y-4">
              <h3 className="text-xl">3. Create GitRepository</h3>
              <p className="text-cloud/70">Point Flux at your repo:</p>
              <CodeBlock code={fluxGitRepo} language="yaml" />
            </div>

            <div className="space-y-4">
              <h3 className="text-xl">4. Create Kustomization</h3>
              <p className="text-cloud/70">Tell Flux to apply the rendered output:</p>
              <CodeBlock code={fluxKustomization} language="yaml" />
            </div>
          </div>
        </div>
      )}

      {/* Common Sections */}
      <div className="space-y-12">
        <div className="space-y-6">
          <h2 className="text-2xl tracking-tight">Operators Included Automatically</h2>
          <p className="text-cloud/70">
            When you use components that need operators (like <code>database</code> for CloudNativePG), 
            r8s fetches the operator manifests and includes them in the output. No separate installation needed.
          </p>
          <CodeBlock code={renderedOutput} language="yaml" />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl tracking-tight">Project Structure</h2>
          <p className="text-cloud/70">
            Your repository only needs TSX source files:
          </p>
          <CodeBlock code={projectStructure} language="bash" />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl tracking-tight">Your Infrastructure</h2>
          <p className="text-cloud/70">
            Define everything in <code>k8s/r8s.tsx</code>:
          </p>
          <CodeBlock code={r8sTsx} language="tsx" />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl tracking-tight">Multi-Environment</h2>
          <p className="text-cloud/70">
            Use overlays for different environments:
          </p>
          <CodeBlock code={multiEnv} language="tsx" />
        </div>
      </div>

      {/* Next Steps */}
      <div className="p-6 rounded-lg border border-white/10 bg-spruce/20">
        <h2 className="font-serif text-2xl mb-3">Ready to deploy?</h2>
        <p className="text-cloud/70 text-sm leading-relaxed">
          Check out the <a href="/recipes" className="text-moss hover:text-lichen">recipes</a> to find 
          components to deploy, or read about <a href="/operators" className="text-moss hover:text-lichen">operators</a> 
          to understand how dependencies are tracked.
        </p>
      </div>
    </div>
  );
}
