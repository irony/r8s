import { CodeBlock } from "../../components/CodeBlock";

const basicTest = `import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import { App } from '@r8s/recipes';

describe('MyApp', () => {
  it('should create a Deployment with 3 replicas', () => {
    const result = render(
      <App name="api" image="myapp/api:v1" host="api.example.com" replicas={3} />
    );

    const deployment = result.resources.find(r => r.kind === 'Deployment');
    expect(deployment.spec.replicas).toBe(3);
  });

  it('should require CNPG operator when database is used', () => {
    const result = render(<App name="api" image="myapp/api:v1" host="api.example.com" database />);
    
    expect(result.operators).toHaveLength(1);
    expect(result.operators[0].name).toBe('cnpg');
  });
});`;

const guardrailsTest = `import { describe, it, expect } from 'vitest';
import { render, validateResource } from '@r8s/core';
import { App } from '@r8s/recipes';

describe('Guardrails', () => {
  it('should have resource limits on all containers', () => {
    const result = render(<App name="api" image="myapp/api:v1" host="api.example.com" />);
    
    const deployments = result.resources.filter(r => r.kind === 'Deployment');
    
    for (const deployment of deployments) {
      const containers = deployment.spec.template.spec.containers;
      for (const container of containers) {
        expect(container.resources).toBeDefined();
        expect(container.resources.limits).toBeDefined();
        expect(container.resources.limits.cpu).toBeDefined();
        expect(container.resources.limits.memory).toBeDefined();
      }
    }
  });

  it('should not use latest tag', () => {
    const result = render(<App name="api" image="myapp/api:v1.2.3" host="api.example.com" />);
    
    const deployments = result.resources.filter(r => r.kind === 'Deployment');
    
    for (const deployment of deployments) {
      const containers = deployment.spec.template.spec.containers;
      for (const container of containers) {
        expect(container.image).not.toContain(':latest');
      }
    }
  });
});`;

const snapshotTest = `import { describe, it } from 'vitest';
import { render } from '@r8s/core';
import { App } from '@r8s/recipes';

describe('Snapshots', () => {
  it('should match snapshot', () => {
    const result = render(
      <App name="api" image="myapp/api:v1" host="api.example.com" />
    );

    expect(result.resources).toMatchSnapshot();
    expect(result.operators).toMatchSnapshot();
  });
});`;

const ciExample = `name: Test Infrastructure

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm test
      - run: npm run test:guardrails`;

const environmentTest = `import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import { App } from '@r8s/recipes';

describe('Environment-specific', () => {
  it('staging should have 1 replica', () => {
    const result = render(
      <App name="api-staging" image="myapp/api:latest" host="staging.example.com" replicas={1} />
    );

    const deployment = result.resources.find(r => r.kind === 'Deployment');
    expect(deployment.spec.replicas).toBe(1);
  });

  it('production should have 3 replicas', () => {
    const result = render(
      <App name="api" image="myapp/api:v1.2.3" host="api.example.com" replicas={3} />
    );

    const deployment = result.resources.find(r => r.kind === 'Deployment');
    expect(deployment.spec.replicas).toBe(3);
  });
});`;

export default function Page() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl tracking-tight">Testing</h1>
        <p className="text-xl text-cloud/80">
          Test your infrastructure like you test your code. Catch errors before they reach production.
        </p>
      </div>

      {/* Why Test Infrastructure */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Why Test Infrastructure?</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border border-white/10">
            <h3 className="font-serif text-xl mb-3 text-moss">Catch Errors Early</h3>
            <p className="text-cloud/70 text-sm">
              Find missing resource limits, wrong image tags, or missing operators 
              in CI — not in production.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-white/10">
            <h3 className="font-serif text-xl mb-3 text-moss">Document Intent</h3>
            <p className="text-cloud/70 text-sm">
              Tests show what you expect from your infrastructure. 
              New team members can read tests to understand the setup.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-white/10">
            <h3 className="font-serif text-xl mb-3 text-moss">Prevent Regressions</h3>
            <p className="text-cloud/70 text-sm">
              Changing a component? Tests ensure you don't break 
              other services that depend on it.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-white/10">
            <h3 className="font-serif text-xl mb-3 text-moss">Enforce Standards</h3>
            <p className="text-cloud/70 text-sm">
              Guardrails verify organizational requirements: 
              labels, resource limits, security policies.
            </p>
          </div>
        </div>
      </div>

      {/* Basic Testing */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Basic Testing</h2>
        <p className="text-cloud/70">
          r8s components are just TypeScript functions. Test them with Vitest:
        </p>
        <CodeBlock code={basicTest} language="tsx" />
      </div>

      {/* Guardrails */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Guardrails</h2>
        <p className="text-cloud/70">
          Write tests that verify your infrastructure meets organizational requirements:
        </p>
        <CodeBlock code={guardrailsTest} language="tsx" />
      </div>

      {/* Snapshot Testing */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Snapshot Testing</h2>
        <p className="text-cloud/70">
          Use snapshots to detect unexpected changes in rendered output:
        </p>
        <CodeBlock code={snapshotTest} language="tsx" />
      </div>

      {/* Environment Testing */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Environment-Specific Tests</h2>
        <p className="text-cloud/70">
          Verify that staging and production have the correct configuration:
        </p>
        <CodeBlock code={environmentTest} language="tsx" />
      </div>

      {/* CI/CD */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">CI/CD Integration</h2>
        <p className="text-cloud/70">
          Run tests on every push and pull request:
        </p>
        <CodeBlock code={ciExample} language="yaml" />
      </div>

      {/* Next Steps */}
      <div className="p-6 rounded-lg border border-white/10 bg-spruce/20">
        <h2 className="font-serif text-2xl mb-3">Ready to test your infrastructure?</h2>
        <p className="text-cloud/70 text-sm leading-relaxed">
          Check out the <a href="/recipes" className="text-moss hover:text-lichen">recipes</a> to find 
          components to test, or read about <a href="/operators" className="text-moss hover:text-lichen">operators</a> 
          to understand what dependencies to verify.
        </p>
      </div>
    </div>
  );
}
