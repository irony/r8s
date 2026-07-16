#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { renderToYaml } from './renderer';

interface CliOptions {
  entry?: string;
  out?: string;
  help?: boolean;
  template?: string;
  operators?: string;
  strategy?: 'github-actions' | 'flux-controller';
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--entry' || arg === '-e') {
      options.entry = args[++i];
    } else if (arg === '--out' || arg === '-o') {
      options.out = args[++i];
    } else if (arg === '--template' || arg === '-t') {
      options.template = args[++i];
    } else if (arg === '--operators') {
      options.operators = args[++i];
    } else if (arg === '--strategy' || arg === '-s') {
      options.strategy = args[++i] as 'github-actions' | 'flux-controller';
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
r8s CLI - Render TSX components to Kubernetes YAML

Usage: r8s [command] [options]

Commands:
  render    Render k8s/r8s.tsx to YAML (default)
  init      Scaffold a new r8s project

Options:
  --entry, -e <path>     Entry file path (default: k8s/r8s.tsx)
  --out, -o <path>       Output file path (default: stdout)
  --template, -t <name>  Template for init (basic, fullstack) [default: basic]
  --operators <list>     Comma-separated list of operators to include
  --strategy, -s <name>  Deployment strategy:
                         - github-actions: Render YAML in CI (default)
                         - flux-controller: Keep .tsx files, render in-cluster
  --help, -h             Show this help message

Examples:
  r8s render
  r8s render --entry ./infra/manifest.tsx
  r8s render --out ./output/k8s.yaml
  r8s init
  r8s init my-project
  r8s init my-project --template fullstack
  r8s init my-project --strategy flux-controller
  r8s init my-project --operators cert-manager,vault
`);
}

async function findEntryFile(entryPath?: string): Promise<string> {
  if (entryPath) {
    const resolved = resolve(entryPath);
    if (!existsSync(resolved)) {
      throw new Error(`Entry file not found: ${resolved}`);
    }
    return resolved;
  }

  const defaults = [
    'k8s/r8s.tsx',
    'k8s/r8s.tsx',
    'k8s/index.tsx',
    'infra/r8s.tsx',
  ];

  for (const defaultPath of defaults) {
    const resolved = resolve(defaultPath);
    if (existsSync(resolved)) {
      return resolved;
    }
  }

  throw new Error(
    'No entry file found. Expected one of:\n' +
      defaults.map((d) => `  - ${d}`).join('\n') +
      '\n\nUse --entry to specify a custom path.'
  );
}

const VALID_OPERATORS = ['cert-manager', 'vault', 'keycloak', 'external-dns', 'redis', 'gateway', 'monitoring', 'clickhouse', 'logging', 'loki'];

async function initProject(
  projectName: string,
  template: string,
  strategy: 'github-actions' | 'flux-controller' = 'github-actions',
  operators?: string[]
): Promise<void> {
  const projectDir = resolve(projectName);

  if (existsSync(projectDir)) {
    throw new Error(`Directory ${projectName} already exists`);
  }

  // Validate operators if provided
  if (operators && operators.length > 0) {
    const invalid = operators.filter(op => !VALID_OPERATORS.includes(op));
    if (invalid.length > 0) {
      throw new Error(
        `Invalid operators: ${invalid.join(', ')}. ` +
        `Valid operators are: ${VALID_OPERATORS.join(', ')}`
      );
    }
  }

  console.log(`Creating r8s project: ${projectName}`);
  console.log(`Deployment strategy: ${strategy}`);

  // Create directory structure
  mkdirSync(join(projectDir, 'k8s'), { recursive: true });

  // Create package.json
  const dependencies: Record<string, string> = {
    '@r8s/core': '^0.1.0',
    '@r8s/recipes': '^0.1.0',
  };

  // Add operator packages if requested
  if (operators) {
    for (const op of operators) {
      dependencies[`@r8s/${op}`] = '^0.1.0';
    }
  }

  const scripts: Record<string, string> = {};
  if (strategy === 'github-actions') {
    scripts['render-k8s'] = 'r8s render';
  }

  const packageJson = {
    name: projectName,
    version: '0.1.0',
    private: true,
    scripts,
    dependencies,
    devDependencies: {
      '@r8s/cli': '^0.1.0',
      typescript: '^5.3.0',
    },
  };

  writeFileSync(
    join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf-8'
  );

  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      jsx: 'react-jsx',
      jsxImportSource: '@r8s/core',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ['k8s/**/*'],
  };

  writeFileSync(
    join(projectDir, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2) + '\n',
    'utf-8'
  );

  // Create k8s/r8s.tsx based on template
  let r8sContent: string;

  if (template === 'fullstack') {
    r8sContent = generateFullstackTemplate(strategy);
  } else {
    r8sContent = generateBasicTemplate(strategy);
  }

  writeFileSync(
    join(projectDir, 'k8s', 'r8s.tsx'),
    r8sContent,
    'utf-8'
  );

  // Create .gitignore
  const gitignore = strategy === 'github-actions'
    ? `node_modules/
dist/
# Ignore rendered manifests except in k8s directory
*.yaml
!k8s/*.yaml
!.github/
`
    : `node_modules/
dist/
# Keep .tsx files, Flux renders them in-cluster
*.yaml
!k8s/*.yaml
!.github/
!flux/
`;

  writeFileSync(
    join(projectDir, '.gitignore'),
    gitignore,
    'utf-8'
  );

  // Create deployment strategy files
  if (strategy === 'github-actions') {
    createGitHubActionsWorkflow(projectDir);
  } else {
    createFluxControllerFiles(projectDir, projectName);
  }

  // Create README.md
  const readme = generateReadme(projectName, strategy);

  writeFileSync(
    join(projectDir, 'README.md'),
    readme,
    'utf-8'
  );

  console.log(`\n✅ Project created: ${projectName}`);
  console.log(`\nDeployment strategy: ${strategy}`);
  
  if (strategy === 'github-actions') {
    console.log(`\nNext steps:`);
    console.log(`  cd ${projectName}`);
    console.log(`  npm install`);
    console.log(`  npm run render-k8s`);
    console.log(`\nGitHub Actions will auto-render on push to main.`);
  } else {
    console.log(`\nNext steps:`);
    console.log(`  cd ${projectName}`);
    console.log(`  npm install`);
    console.log(`  git init && git add . && git commit -m "init"`);
    console.log(`  # Push to a Git repository`);
    console.log(`  # Configure FluxCD to point to your repo`);
    console.log(`\nFluxCD will render .tsx files in-cluster.`);
    console.log(`See flux/ directory for example manifests.`);
  }
}

function generateBasicTemplate(strategy: string): string {
  const fluxComment = strategy === 'flux-controller'
    ? `// This file stays as .tsx - FluxCD renders it in-cluster via r8s-controller\n`
    : '';

  return `${fluxComment}import { Database, Ingress } from '@r8s/recipes';

export default function App() {
  return (
    <>
      <Database
        name="app-db"
        namespace="default"
        storage="10Gi"
      />

      <deployment
        apiVersion="apps/v1"
        kind="Deployment"
        metadata={{ name: 'app', labels: { app: 'app' } }}
        spec={{
          replicas: 2,
          selector: { matchLabels: { app: 'app' } },
          template: {
            metadata: { labels: { app: 'app' } },
            spec: {
              containers: [{
                name: 'app',
                image: 'myapp/app:latest',
                ports: [{ containerPort: 3000 }],
              }],
            },
          },
        }}
      />

      <service
        apiVersion="v1"
        kind="Service"
        metadata={{ name: 'app' }}
        spec={{
          type: 'ClusterIP',
          selector: { app: 'app' },
          ports: [{ port: 80, targetPort: 3000 }],
        }}
      />

      <Ingress
        name="app-ingress"
        host="app.example.com"
        serviceName="app"
        servicePort={80}
        tls={{ secretName: 'app-tls', clusterIssuer: 'letsencrypt' }}
      />
    </>
  );
}
`;
}

function generateFullstackTemplate(strategy: string): string {
  const fluxComment = strategy === 'flux-controller'
    ? `// This file stays as .tsx - FluxCD renders it in-cluster via r8s-controller\n`
    : '';

  return `${fluxComment}import { Database, Ingress } from '@r8s/recipes';

export default function App() {
  return (
    <>
      {/* Database */}
      <Database
        name="app-db"
        namespace="production"
        storage="10Gi"
      />

      {/* Backend API */}
      <deployment
        apiVersion="apps/v1"
        kind="Deployment"
        metadata={{ name: 'api', namespace: 'production', labels: { app: 'api' } }}
        spec={{
          replicas: 3,
          selector: { matchLabels: { app: 'api' } },
          template: {
            metadata: { labels: { app: 'api' } },
            spec: {
              containers: [{
                name: 'api',
                image: 'myapp/api:latest',
                ports: [{ containerPort: 3000 }],
              }],
            },
          },
        }}
      />

      <service
        apiVersion="v1"
        kind="Service"
        metadata={{ name: 'api', namespace: 'production' }}
        spec={{
          type: 'ClusterIP',
          selector: { app: 'api' },
          ports: [{ port: 80, targetPort: 3000 }],
        }}
      />

      {/* Frontend */}
      <deployment
        apiVersion="apps/v1"
        kind="Deployment"
        metadata={{ name: 'frontend', namespace: 'production', labels: { app: 'frontend' } }}
        spec={{
          replicas: 2,
          selector: { matchLabels: { app: 'frontend' } },
          template: {
            metadata: { labels: { app: 'frontend' } },
            spec: {
              containers: [{
                name: 'frontend',
                image: 'myapp/frontend:latest',
                ports: [{ containerPort: 80 }],
              }],
            },
          },
        }}
      />

      <service
        apiVersion="v1"
        kind="Service"
        metadata={{ name: 'frontend', namespace: 'production' }}
        spec={{
          type: 'ClusterIP',
          selector: { app: 'frontend' },
          ports: [{ port: 80, targetPort: 80 }],
        }}
      />

      {/* Ingress */}
      <Ingress
        name="app-ingress"
        namespace="production"
        host="app.example.com"
        serviceName="frontend"
        servicePort={80}
        tls={{ secretName: 'app-tls', clusterIssuer: 'letsencrypt' }}
      />
    </>
  );
}
`;
}

function createGitHubActionsWorkflow(projectDir: string): void {
  mkdirSync(join(projectDir, '.github', 'workflows'), { recursive: true });

  const workflowContent = `name: Render Kubernetes Manifests

on:
  push:
    branches: [main, master]
    paths:
      - 'k8s/**'
      - 'package.json'
      - 'package-lock.json'
  pull_request:
    branches: [main, master]
    paths:
      - 'k8s/**'

jobs:
  render:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Render Kubernetes manifests
        run: npx r8s render --out k8s/manifest.yaml

      - name: Check for changes
        id: git-check
        run: |
          git diff --quiet k8s/manifest.yaml || echo "changed=true" >> \$GITHUB_OUTPUT

      - name: Commit rendered manifests
        if: steps.git-check.outputs.changed == 'true' && github.event_name == 'push'
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add k8s/manifest.yaml
          git commit -m "chore: render kubernetes manifests [skip ci]"
          git push
`;

  writeFileSync(
    join(projectDir, '.github', 'workflows', 'render.yaml'),
    workflowContent,
    'utf-8'
  );
}

function createFluxControllerFiles(projectDir: string, projectName: string): void {
  // Create flux/ directory with example manifests
  mkdirSync(join(projectDir, 'flux'), { recursive: true });

  const gitRepository = `apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: ${projectName}
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/your-org/${projectName}
  ref:
    branch: main
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: ${projectName}
  namespace: flux-system
spec:
  interval: 10m
  path: ./k8s/rendered
  prune: true
  sourceRef:
    kind: GitRepository
    name: ${projectName}
`;

  writeFileSync(
    join(projectDir, 'flux', 'gitrepository.yaml'),
    gitRepository,
    'utf-8'
  );

  const webhook = `apiVersion: notification.toolkit.fluxcd.io/v1
kind: Receiver
metadata:
  name: ${projectName}-webhook
  namespace: flux-system
spec:
  type: github
  events:
    - ping
    - push
  secretRef:
    name: ${projectName}-webhook-token
  resources:
    - apiVersion: source.toolkit.fluxcd.io/v1
      kind: GitRepository
      name: ${projectName}
      namespace: flux-system
---
apiVersion: v1
kind: Secret
metadata:
  name: ${projectName}-webhook-token
  namespace: flux-system
type: Opaque
stringData:
  token: "replace-me-with-20-char-random-string"
`;

  writeFileSync(
    join(projectDir, 'flux', 'webhook.yaml'),
    webhook,
    'utf-8'
  );

  const readme = `# FluxCD Setup for ${projectName}

## Prerequisites

1. FluxCD installed on your cluster
2. r8s-controller image available (or build your own)

## Setup

### 1. Configure FluxCD

Apply the manifests in this directory:

\`\`\`bash
kubectl apply -f flux/gitrepository.yaml
kubectl apply -f flux/webhook.yaml
\`\`\`

### 2. Configure GitHub Webhook

1. Go to your repository → Settings → Webhooks
2. Add webhook:
   - Payload URL: \`https://flux-webhook.yourdomain.com/hook/flux-system/${projectName}-webhook\`
   - Content type: \`application/json\`
   - Secret: (the token from flux/webhook.yaml)
   - Events: Push

### 3. Configure r8s-controller

The r8s-controller runs as an init container in the Flux source-controller.

See https://github.com/r8s-io/r8s/tree/main/packages/flux-controller for setup instructions.

## How It Works

1. You push .tsx files to git
2. GitHub webhook triggers Flux reconciliation
3. Flux clones repo to /data
4. r8s-controller renders TSX → YAML to /data/rendered
5. Flux Kustomization applies rendered YAML

## Local Development

\`\`\`bash
# Render locally for testing
npm install
npx r8s render --out k8s/manifest.yaml
\`\`\`
`;

  writeFileSync(
    join(projectDir, 'flux', 'README.md'),
    readme,
    'utf-8'
  );
}

function generateReadme(projectName: string, strategy: string): string {
  if (strategy === 'github-actions') {
    return `# ${projectName}

Generated with r8s (GitHub Actions strategy).

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Render Kubernetes manifests locally
npm run render-k8s

# Or use the CLI directly
npx r8s render
npx r8s render --out k8s/manifest.yaml
\`\`\`

## Project Structure

\`\`\`
.
├── .github/
│   └── workflows/
│       └── render.yaml   # Auto-render on push
├── k8s/
│   ├── r8s.tsx          # Your Kubernetes components
│   └── manifest.yaml     # Generated YAML (auto-committed)
├── package.json
└── tsconfig.json
\`\`\`

## Deployment Strategy: GitHub Actions

This project uses **GitHub Actions** to render TSX → YAML:

1. You edit \`k8s/r8s.tsx\` and push to \`main\`
2. GitHub Actions renders the TSX to \`k8s/manifest.yaml\`
3. The rendered YAML is committed back to the repository
4. Your GitOps tool (Flux, ArgoCD) picks up the YAML and applies it

## Learn More

- [r8s Documentation](https://github.com/r8s-io/r8s)
- [FluxCD Integration](https://github.com/r8s-io/r8s/tree/main/packages/flux-controller)
`;
  } else {
    return `# ${projectName}

Generated with r8s (Flux Controller strategy).

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Render locally for testing
npx r8s render --out k8s/manifest.yaml
\`\`\`

## Project Structure

\`\`\`
.
├── flux/
│   ├── gitrepository.yaml   # Flux GitRepository manifest
│   ├── webhook.yaml         # Webhook receiver for instant sync
│   └── README.md           # Flux setup instructions
├── k8s/
│   └── r8s.tsx            # Your Kubernetes components (kept as .tsx)
├── package.json
└── tsconfig.json
\`\`\`

## Deployment Strategy: Flux Controller

This project uses **FluxCD with r8s-controller** to render TSX → YAML in-cluster:

1. You edit \`k8s/r8s.tsx\` and push to \`main\`
2. GitHub webhook triggers Flux reconciliation (instant)
3. Flux clones repo to /data
4. r8s-controller (init container) renders TSX → YAML to /data/rendered
5. Flux Kustomization applies rendered YAML to cluster

## Benefits

- **No CI build step** — rendering happens in-cluster
- **Git is source of truth** — only .tsx files in repo
- **Instant updates** — webhook triggers reconciliation immediately
- **Type safety** — catch errors at build time

## Setup

See \`flux/README.md\` for detailed setup instructions.

## Learn More

- [r8s Documentation](https://github.com/r8s-io/r8s)
- [FluxCD Controller](https://github.com/r8s-io/r8s/tree/main/packages/flux-controller)
- [FluxCD Webhooks](https://github.com/r8s-io/r8s/tree/main/packages/flux-controller/WEBHOOKS.md)
`;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  const command = args[0] || 'render';

  if (command === 'init') {
    const projectName = args[1] || 'r8s-app';
    const template = options.template || 'basic';
    const strategy = options.strategy || 'github-actions';
    const operators = options.operators?.split(',').map(op => op.trim()).filter(Boolean);

    if (strategy !== 'github-actions' && strategy !== 'flux-controller') {
      console.error(`Invalid strategy: ${strategy}. Valid: github-actions, flux-controller`);
      process.exit(1);
    }

    try {
      await initProject(projectName, template, strategy, operators);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
    return;
  }

  if (command !== 'render') {
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
  }

  try {
    const entryFile = await findEntryFile(options.entry);
    console.error(`Rendering: ${entryFile}`);

    const yamlOutput = await renderToYaml(entryFile);

    if (options.out) {
      const { writeFileSync } = await import('fs');
      writeFileSync(resolve(options.out), yamlOutput, 'utf-8');
      console.error(`Output written to: ${resolve(options.out)}`);
    } else {
      console.log(yamlOutput);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
