import { CodeBlock } from "../../components/CodeBlock";

const projectStructure = `my-project/
├── k8s/
│   ├── r8s.tsx              # Your infrastructure
│   └── __tests__/
│       └── r8s.test.ts      # Tests for your infrastructure
├── package.json
└── tsconfig.json`;

const infrastructureCode = `// k8s/r8s.tsx
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

const basicTest = `// k8s/__tests__/r8s.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import infrastructure from '../r8s';

describe('Infrastructure', () => {
  it('should create a Deployment with 3 replicas', () => {
    const result = render(infrastructure);

    const deployment = result.resources.find(r => r.kind === 'Deployment');
    expect(deployment.spec.replicas).toBe(3);
  });

  it('should require CNPG operator for database', () => {
    const result = render(infrastructure);
    
    expect(result.operators).toHaveLength(1);
    expect(result.operators[0].name).toBe('cnpg');
  });
});`;

const guardrailsTest = `// k8s/__tests__/guardrails.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import { runGuardrails, requireResourceLimits } from '@r8s/core/guardrails';
import infrastructure from '../r8s';

describe('Production Guardrails', () => {
  it('should have resource limits on all containers', () => {
    const result = render(infrastructure);

    const guardrails = runGuardrails(result.resources, [
      requireResourceLimits,
    ]);
    
    expect(guardrails.passed).toBe(true);
    expect(guardrails.errors).toHaveLength(0);
  });

  it('should provide actionable errors when guardrails fail', () => {
    // Simulate infrastructure without resource limits
    const result = render(
      <App name="api" image="myapp/api:v1" host="api.example.com" />
    );

    const guardrails = runGuardrails(result.resources, [
      requireResourceLimits,
    ]);
    
    expect(guardrails.passed).toBe(false);
    expect(guardrails.errors[0].code).toBe('MISSING_RESOURCE_LIMITS');
    expect(guardrails.errors[0].suggestion).toContain('resource.limits');
  });
});`;

const guardrailsOutput = `// When guardrails fail, you get detailed actionable errors
{
  passed: false,
  errors: [
    {
      code: 'MISSING_RESOURCE_LIMITS',
      message: 'Container "api" in Deployment "api" is missing resource limits',
      resource: 'Deployment',
      field: 'spec.template.spec.containers[].resources.limits',
      suggestion: 'Add resource.limits with cpu and memory values to prevent resource exhaustion'
    }
  ],
  warnings: [],
  info: []
}`;

const multipleGuardrails = `// k8s/__tests__/guardrails.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import { 
  runGuardrails,
  requireResourceLimits,
  requireTLS,
  noRootContainers 
} from '@r8s/core/guardrails';
import infrastructure from '../r8s';

describe('Production Readiness', () => {
  it('should pass all production guardrails', () => {
    const result = render(infrastructure);

    // Combine multiple guardrails
    const guardrails = runGuardrails(result.resources, [
      requireResourceLimits,  // Prevent resource exhaustion
      requireTLS,             // Enforce HTTPS
      noRootContainers,       // Security best practice
    ]);
    
    expect(guardrails.passed).toBe(true);
    expect(guardrails.errors).toHaveLength(0);
    expect(guardrails.warnings).toHaveLength(0);
  });
});`;

const customGuardrail = `// k8s/__tests__/guardrails.test.ts
import { GuardrailRule, runGuardrails } from '@r8s/core/guardrails';
import { requireResourceLimits } from '@r8s/core/guardrails';
import infrastructure from '../r8s';

// Create your own guardrail
const requireReadinessProbe: GuardrailRule = {
  id: 'require-readiness-probe',
  description: 'All containers must have a readiness probe',
  severity: 'warning',
  test: (resources) => {
    const errors = [];
    
    for (const resource of resources) {
      if (resource.kind === 'Deployment') {
        const containers = resource.spec?.template?.spec?.containers || [];
        for (const container of containers) {
          if (!container.readinessProbe) {
            errors.push({
              code: 'MISSING_READINESS_PROBE',
              message: \`Container "\${container.name}" is missing readinessProbe\`,
              resource: 'Deployment',
              field: 'spec.template.spec.containers[].readinessProbe',
              suggestion: 'Add readinessProbe to prevent traffic to unhealthy pods',
            });
          }
        }
      }
    }
    
    return errors;
  },
};

// Use it alongside built-in guardrails
const result = render(infrastructure);

const guardrails = runGuardrails(result.resources, [
  requireResourceLimits,
  requireReadinessProbe,  // Your custom rule
]);`;

const snapshotTest = `// k8s/__tests__/snapshots.test.ts
import { describe, it } from 'vitest';
import { render } from '@r8s/core';
import infrastructure from '../r8s';

describe('Snapshots', () => {
  it('should match snapshot', () => {
    const result = render(infrastructure);

    expect(result.resources).toMatchSnapshot();
    expect(result.operators).toMatchSnapshot();
  });
});`;

const ciExample = `name: Test Infrastructure

on:
  push:
    branches: [main]
    paths:
      - 'k8s/**'
  pull_request:
    branches: [main]
    paths:
      - 'k8s/**'

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
      - run: npm test`;

export default function Page() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl tracking-tight">Testing</h1>
        <p className="text-xl text-cloud/80">
          Infrastructure is just code. Test it like code.
        </p>
      </div>

      {/* Why Test Infrastructure */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Why Test Infrastructure?</h2>
        <p className="text-cloud/70 leading-relaxed">
          With r8s, your Kubernetes manifests are TypeScript components. That means you can test them 
          with the same tools you use for your application code — Vitest, Jest, or any test runner.
        </p>
        <p className="text-cloud/70 leading-relaxed">
          No more deploying to staging and hoping it works. Run tests in CI and catch issues 
          before they reach any cluster.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mt-8">
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
              Pick the guardrails that matter for your organization. 
              Start with one, add more as you grow.
            </p>
          </div>
        </div>
      </div>

      {/* Project Structure */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Project Structure</h2>
        <p className="text-cloud/70">
          Keep your infrastructure and tests together:
        </p>
        <CodeBlock code={projectStructure} language="bash" />
      </div>

      {/* Your Infrastructure */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Your Infrastructure</h2>
        <p className="text-cloud/70">
          Define your infrastructure in <code>k8s/r8s.tsx</code>:
        </p>
        <CodeBlock code={infrastructureCode} language="tsx" />
      </div>

      {/* Basic Testing */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Test Your Infrastructure</h2>
        <p className="text-cloud/70">
          Import your infrastructure and test it with Vitest:
        </p>
        <CodeBlock code={basicTest} language="tsx" />
      </div>

      {/* Built-in Guardrails */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Built-in Guardrails</h2>
        <p className="text-cloud/70">
          Don't write boilerplate test code. r8s includes production-ready guardrails 
          in <code>@r8s/core/guardrails</code> that enforce Kubernetes best practices. 
          Import the ones you need and run them with a single function call.
        </p>
        
        <div className="p-6 rounded-lg border border-moss/30 bg-moss/5">
          <p className="text-cloud/80">
            <strong className="text-moss">Why guardrails?</strong>{" "}
            Instead of writing repetitive tests like "check that every container has resource limits", 
            use the built-in <code>requireResourceLimits</code> guardrail. It checks all containers 
            across all Deployments, StatefulSets, and DaemonSets — and gives you actionable error messages.
          </p>
        </div>
      </div>

      {/* Most Valuable Guardrail */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Example: Resource Limits</h2>
        <p className="text-cloud/70">
          The most common production issue is missing resource limits. One line prevents 
          resource exhaustion and noisy neighbor problems:
        </p>
        <CodeBlock code={guardrailsTest} language="tsx" />
        <CodeBlock code={guardrailsOutput} language="tsx" />
      </div>

      {/* Multiple Guardrails */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Combine Multiple Guardrails</h2>
        <p className="text-cloud/70">
          Mix and match guardrails for your requirements. Each guardrail is independent — 
          pick the ones that matter for your team:
        </p>
        <CodeBlock code={multipleGuardrails} language="tsx" />
      </div>

      {/* Available Guardrails */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">All Available Guardrails</h2>
        <p className="text-cloud/70">
          Import only the ones you need:
        </p>
        
        <div className="space-y-3">
          <div className="flex items-start gap-4 p-4 rounded-lg border border-white/10">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-400 mt-2" />
            <div>
              <h3 className="font-medium">requireResourceLimits</h3>
              <p className="text-cloud/70 text-sm">
                All containers must have resource requests and limits.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 rounded-lg border border-white/10">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-400 mt-2" />
            <div>
              <h3 className="font-medium">requireNetworkPolicies</h3>
              <p className="text-cloud/70 text-sm">
                All namespaces must have at least one NetworkPolicy.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 rounded-lg border border-white/10">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-400 mt-2" />
            <div>
              <h3 className="font-medium">noPlaintextSecrets</h3>
              <p className="text-cloud/70 text-sm">
                Secrets should not contain plaintext passwords.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 rounded-lg border border-white/10">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-400 mt-2" />
            <div>
              <h3 className="font-medium">noRootContainers</h3>
              <p className="text-cloud/70 text-sm">
                Containers should not run as root user.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 rounded-lg border border-white/10">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-400 mt-2" />
            <div>
              <h3 className="font-medium">requireTLS</h3>
              <p className="text-cloud/70 text-sm">
                All Ingress resources must have TLS configured.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 rounded-lg border border-white/10">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-400 mt-2" />
            <div>
              <h3 className="font-medium">requireLabels</h3>
              <p className="text-cloud/70 text-sm">
                All resources must have required labels. Pass your own label names.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Guardrails */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Custom Guardrails</h2>
        <p className="text-cloud/70">
          Need something specific? Create your own guardrails for organizational requirements:
        </p>
        <CodeBlock code={customGuardrail} language="tsx" />
      </div>

      {/* Snapshot Testing */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Snapshot Testing</h2>
        <p className="text-cloud/70">
          Use snapshots to detect unexpected changes in rendered output:
        </p>
        <CodeBlock code={snapshotTest} language="tsx" />
      </div>

      {/* CI/CD */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">CI/CD Integration</h2>
        <p className="text-cloud/70">
          Run tests on every push to your k8s/ folder:
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
