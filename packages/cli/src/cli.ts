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
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
ReactNetes CLI - Render TSX components to Kubernetes YAML

Usage: reactnetes [command] [options]

Commands:
  render    Render k8s/ReactNetes.tsx to YAML (default)
  init      Scaffold a new ReactNetes project

Options:
  --entry, -e <path>     Entry file path (default: k8s/ReactNetes.tsx)
  --out, -o <path>       Output file path (default: stdout)
  --template, -t <name>  Template for init (basic, fullstack) [default: basic]
  --operators <list>     Comma-separated list of operators to include
                         (cert-manager, vault, keycloak, external-dns)
  --help, -h             Show this help message

Examples:
  reactnetes render
  reactnetes render --entry ./infra/manifest.tsx
  reactnetes render --out ./output/k8s.yaml
  reactnetes init
  reactnetes init my-project
  reactnetes init my-project --template fullstack
  reactnetes init my-project --operators cert-manager,vault
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
    'k8s/ReactNetes.tsx',
    'k8s/reactnetes.tsx',
    'k8s/index.tsx',
    'infra/ReactNetes.tsx',
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

const VALID_OPERATORS = ['cert-manager', 'vault', 'keycloak', 'external-dns'];

async function initProject(projectName: string, template: string, operators?: string[]): Promise<void> {
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

  console.log(`Creating ReactNetes project: ${projectName}`);

  // Create directory structure
  mkdirSync(join(projectDir, 'k8s'), { recursive: true });

  // Create package.json
  const dependencies: Record<string, string> = {
    '@reactnetes/core': '^0.1.0',
    '@reactnetes/recipes': '^0.1.0',
  };

  // Add operator packages if requested
  if (operators) {
    for (const op of operators) {
      dependencies[`@reactnetes/recipes-${op}`] = '^0.1.0';
    }
  }

  const packageJson = {
    name: projectName,
    version: '0.1.0',
    private: true,
    scripts: {
      'render-k8s': 'reactnetes render',
    },
    dependencies,
    devDependencies: {
      '@reactnetes/cli': '^0.1.0',
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
      jsxImportSource: '@reactnetes/core',
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

  // Create k8s/ReactNetes.tsx based on template
  let reactNetesContent: string;

  if (template === 'fullstack') {
    reactNetesContent = `import { Postgres, CustomIngress } from '@reactnetes/recipes';

export default function App() {
  return (
    <>
      {/* Database - uses external secret for credentials */}
      <Postgres
        name="app-db"
        namespace="production"
        database="myapp"
        user="myapp"
        passwordSecretName="app-db-credentials"
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
                env: [{
                  name: 'DATABASE_URL',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'app-db-credentials',
                      key: 'uri',
                    },
                  },
                }],
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
      <CustomIngress
        name="app-ingress"
        namespace="production"
        host="app.example.com"
        serviceName="frontend"
        servicePort={80}
        tlsSecretName="app-tls"
      />
    </>
  );
}
`;
  } else {
    // Basic template
    reactNetesContent = `import { Postgres, CustomIngress } from '@reactnetes/recipes';

export default function App() {
  return (
    <>
      {/* Database - uses external secret for credentials */}
      <Postgres
        name="app-db"
        namespace="default"
        database="myapp"
        user="myapp"
        passwordSecretName="app-db-credentials"
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
                env: [{
                  name: 'DATABASE_URL',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'app-db-credentials',
                      key: 'uri',
                    },
                  },
                }],
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

      <CustomIngress
        name="app-ingress"
        host="app.example.com"
        serviceName="app"
        servicePort={80}
        tlsSecretName="app-tls"
      />
    </>
  );
}
`;
  }

  writeFileSync(
    join(projectDir, 'k8s', 'ReactNetes.tsx'),
    reactNetesContent,
    'utf-8'
  );

  // Create .gitignore
  const gitignore = `node_modules/
dist/
# Ignore rendered manifests except in k8s directory
*.yaml
!k8s/*.yaml
!.github/
`;

  writeFileSync(
    join(projectDir, '.gitignore'),
    gitignore,
    'utf-8'
  );

  // Create GitHub Actions workflow
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
        run: npx reactnetes render --out k8s/manifest.yaml

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

  // Create README.md
  const readme = `# ${projectName}

Generated with ReactNetes.

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Render Kubernetes manifests
npm run render-k8s

# Or use the CLI directly
npx reactnetes render
npx reactnetes render --out k8s/manifest.yaml
\`\`\`

## Project Structure

\`\`\`
.
├── .github/
│   └── workflows/
│       └── render.yaml   # Auto-render on push
├── k8s/
│   ├── ReactNetes.tsx    # Your Kubernetes components
│   └── manifest.yaml       # Generated YAML (auto-committed)
├── package.json
└── tsconfig.json
\`\`\`

## Editing Manifests

Open \`k8s/ReactNetes.tsx\` and edit your components. Run \`npm run render-k8s\` to generate YAML.

## GitHub Actions

This project includes a GitHub Actions workflow that automatically renders your Kubernetes manifests on every push to \`main\` or \`master\`. The rendered \`k8s/manifest.yaml\` is automatically committed back to the repository.

## Learn More

- [ReactNetes Documentation](https://github.com/yourusername/reactnetes)
- [Recipes](https://github.com/yourusername/reactnetes/tree/main/packages/recipes)
`;

  writeFileSync(
    join(projectDir, 'README.md'),
    readme,
    'utf-8'
  );

  console.log(`\n✅ Project created: ${projectName}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${projectName}`);
  console.log(`  npm install`);
  console.log(`  npm run render-k8s`);
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
    const projectName = args[1] || 'reactnetes-app';
    const template = options.template || 'basic';
    const operators = options.operators?.split(',').map(op => op.trim()).filter(Boolean);

    try {
      await initProject(projectName, template, operators);
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
