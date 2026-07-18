import { CodeBlock } from "../../components/CodeBlock";

const githubActions = `name: Render Kubernetes Manifests

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
          git diff --quiet && git diff --staged --quiet || \\
            (git commit -m "chore: render kubernetes manifests [skip ci]" && git push)`;

const fluxGitRepo = `apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: r8s-manifests
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/your-org/your-repo
  ref:
    branch: main`;

const fluxKustomization = `apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: r8s-rendered
  namespace: flux-system
spec:
  interval: 10m
  path: ./k8s
  sourceRef:
    kind: GitRepository
    name: r8s-manifests
  prune: true`;

const fluxWebhook = `apiVersion: notification.toolkit.fluxcd.io/v1
kind: Receiver
metadata:
  name: r8s-github-webhook
  namespace: flux-system
spec:
  type: github
  events: [push]
  secretRef:
    name: r8s-webhook-token
  resources:
    - apiVersion: source.toolkit.fluxcd.io/v1
      kind: GitRepository
      name: r8s-manifests`;

const projectStructure = `my-project/
├── k8s/
│   ├── r8s.tsx              # Your r8s components
│   ├── manifest.yaml        # Rendered output (auto-generated)
│   └── overlays/
│       ├── staging/
│       │   └── r8s.tsx      # Staging-specific config
│       └── production/
│           └── r8s.tsx      # Production-specific config
├── .github/
│   └── workflows/
│       └── render.yaml      # Auto-render on push
├── package.json
└── tsconfig.json`;

const stagingExample = `// k8s/overlays/staging/r8s.tsx
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
);`;

const productionExample = `// k8s/overlays/production/r8s.tsx
import { App } from '@r8s/recipes';

export default (
  <App
    name="myapp"
    image="myapp/api:v1.2.3"
    host="api.example.com"
    replicas={3}
    database={{ name: "app-db", storage: "20Gi" }}
    tls={{ issuer: "letsencrypt" }}
    env={{
      NODE_ENV: "production",
      LOG_LEVEL: "info",
    }}
    resources={{
      requests: { cpu: "100m", memory: "128Mi" },
      limits: { cpu: "500m", memory: "512Mi" },
    }}
  />
);`;

const gitopsFlow = `# Developer workflow
1. Edit k8s/r8s.tsx
2. git add k8s/r8s.tsx
3. git commit -m "update: increase replicas to 5"
4. git push origin main

# GitHub Actions
5. Render TSX → YAML
6. Commit manifest.yaml

# FluxCD
7. Detect new commit
8. Apply manifest.yaml to cluster`;

export default function Page() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl tracking-tight">Deployment</h1>
        <p className="text-xl text-cloud/80">
          Deploy r8s infrastructure with GitOps. Push TSX, get YAML, apply to cluster.
        </p>
      </div>

      {/* GitOps Flow */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">GitOps Workflow</h2>
        <p className="text-cloud/70">
          r8s is designed for GitOps. You edit TypeScript components, push to git, 
          and your cluster updates automatically.
        </p>
        <CodeBlock code={gitopsFlow} language="bash" />
      </div>

      {/* Project Structure */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Project Structure</h2>
        <CodeBlock code={projectStructure} language="bash" />
      </div>

      {/* GitHub Actions */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">GitHub Actions</h2>
        <p className="text-cloud/70">
          Automatically render manifests on every push. Add this to 
          <code>.github/workflows/render.yaml</code>:
        </p>
        <CodeBlock code={githubActions} language="yaml" />
      </div>

      {/* FluxCD */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">FluxCD</h2>
        <p className="text-cloud/70">
          FluxCD watches your git repository and applies changes automatically.
        </p>
        
        <div className="space-y-4">
          <h3 className="text-xl">1. Git Repository Source</h3>
          <p className="text-cloud/70 text-sm">
            Tell FluxCD where your repository is:
          </p>
          <CodeBlock code={fluxGitRepo} language="yaml" />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl">2. Kustomization</h3>
          <p className="text-cloud/70 text-sm">
            Define what to apply and how often:
          </p>
          <CodeBlock code={fluxKustomization} language="yaml" />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl">3. Webhook (Instant Sync)</h3>
          <p className="text-cloud/70 text-sm">
            Get instant reconciliation when you push:
          </p>
          <CodeBlock code={fluxWebhook} language="yaml" />
        </div>
      </div>

      {/* Multi-Environment */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Multi-Environment Setup</h2>
        <p className="text-cloud/70">
          Use the same components with different props for staging and production:
        </p>
        
        <div className="space-y-4">
          <h3 className="text-xl">Staging</h3>
          <CodeBlock code={stagingExample} language="tsx" />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl">Production</h3>
          <CodeBlock code={productionExample} language="tsx" />
        </div>
      </div>

      {/* Architecture */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Architecture</h2>
        <div className="p-6 rounded-lg border border-white/10 bg-spruce/20">
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-4">
              <span className="text-moss font-mono">Developer</span>
              <span className="text-cloud/40">→</span>
              <span className="text-cloud/70">Edit k8s/r8s.tsx</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-moss font-mono">Git</span>
              <span className="text-cloud/40">→</span>
              <span className="text-cloud/70">Push to main</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-moss font-mono">GitHub Actions</span>
              <span className="text-cloud/40">→</span>
              <span className="text-cloud/70">Render TSX → YAML</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-moss font-mono">FluxCD</span>
              <span className="text-cloud/40">→</span>
              <span className="text-cloud/70">Detect & apply</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-moss font-mono">Cluster</span>
              <span className="text-cloud/40">→</span>
              <span className="text-cloud/70">Infrastructure updated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="p-6 rounded-lg border border-white/10 bg-spruce/20">
        <h2 className="font-serif text-2xl mb-3">Ready to deploy?</h2>
        <p className="text-cloud/70 text-sm leading-relaxed">
          Check out the <a href="/recipes" className="text-moss hover:text-lichen">recipes</a> to find 
          the right components for your app, or read about <a href="/operators" className="text-moss hover:text-lichen">operators</a> 
          to understand what needs to be installed in your cluster first.
        </p>
      </div>
    </div>
  );
}
