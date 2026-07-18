import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderToYaml, renderToOperatorsYaml } from '../src/renderer';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const testDir = resolve(__dirname, '../test-temp');

describe('CLI Renderer', () => {
  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should render a simple JS file to YAML', async () => {
    const jsContent = `
const { jsx, Fragment } = require('@r8s/core');

module.exports = function App() {
  return jsx(Fragment, {
    children: [
      jsx('Deployment', {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: 'test' },
        spec: {
          selector: { matchLabels: { app: 'test' } },
          template: {
            metadata: { labels: { app: 'test' } },
            spec: {
              containers: [{ name: 'test', image: 'test:latest' }],
            },
          },
        },
      }),
    ],
  });
};
`;

    const entryFile = join(testDir, 'r8s-simple.js');
    writeFileSync(entryFile, jsContent, 'utf-8');

    const yaml = await renderToYaml(entryFile);

    expect(yaml).toContain('apiVersion: apps/v1');
    expect(yaml).toContain('kind: Deployment');
    expect(yaml).toContain('name: test');
    expect(yaml).toContain('image: test:latest');
  });

  it('should render multiple resources', async () => {
    const jsContent = `
const { jsx, Fragment } = require('@r8s/core');

module.exports = function App() {
  return jsx(Fragment, {
    children: [
      jsx('Deployment', {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: 'app' },
        spec: {
          selector: { matchLabels: { app: 'app' } },
          template: {
            metadata: { labels: { app: 'app' } },
            spec: {
              containers: [{ name: 'app', image: 'app:v1' }],
            },
          },
        },
      }),
      jsx('Service', {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: { name: 'app' },
        spec: {
          selector: { app: 'app' },
          ports: [{ port: 80 }],
        },
      }),
    ],
  });
};
`;

    const entryFile = join(testDir, 'r8s-multi.js');
    writeFileSync(entryFile, jsContent, 'utf-8');

    const yaml = await renderToYaml(entryFile);

    expect(yaml).toContain('---');
    expect(yaml).toContain('kind: Deployment');
    expect(yaml).toContain('kind: Service');
  });

  describe('Operator rendering options', () => {
    const jsContentWithOperator = `
const { jsx, Fragment, declareOperator } = require('@r8s/core');

module.exports = function App() {
  return jsx(Fragment, {
    children: [
      declareOperator({
        name: 'test-operator',
        source: {
          type: 'manifest',
          url: 'https://example.com/operator.yaml',
          version: '1.0.0',
        },
        version: '1.0.0',
      }),
      jsx('Deployment', {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: 'app' },
        spec: {
          selector: { matchLabels: { app: 'app' } },
          template: {
            metadata: { labels: { app: 'app' } },
            spec: {
              containers: [{ name: 'app', image: 'app:v1' }],
            },
          },
        },
      }),
    ],
  });
};
`;

    it('should NOT include operators by default', async () => {
      const entryFile = join(testDir, 'r8s-default.js');
      writeFileSync(entryFile, jsContentWithOperator, 'utf-8');

      const yaml = await renderToYaml(entryFile);

      expect(yaml).toContain('kind: Deployment');
      expect(yaml).not.toContain('Operator: test-operator');
      expect(yaml).not.toContain('example.com');
    });

    it('should include operators with --include-operators', async () => {
      const entryFile = join(testDir, 'r8s-with-operators.js');
      writeFileSync(entryFile, jsContentWithOperator, 'utf-8');

      // Mock fetch to return a fake operator manifest
      const originalFetch = global.fetch;
      global.fetch = async () =>
        ({
          ok: true,
          text: async () => 'apiVersion: v1\nkind: Namespace\nmetadata:\n  name: test-operator-system',
        }) as Response;

      try {
        const yaml = await renderToYaml(entryFile, { includeOperators: true });

        expect(yaml).toContain('Operator: test-operator');
        expect(yaml).toContain('kind: Namespace');
        expect(yaml).toContain('name: test-operator-system');
        expect(yaml).toContain('kind: Deployment');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should render only operators with --operators-only', async () => {
      const entryFile = join(testDir, 'r8s-operators-only.js');
      writeFileSync(entryFile, jsContentWithOperator, 'utf-8');

      // Mock fetch
      const originalFetch = global.fetch;
      global.fetch = async () =>
        ({
          ok: true,
          text: async () => 'apiVersion: v1\nkind: Namespace\nmetadata:\n  name: test-operator-system',
        }) as Response;

      try {
        const yaml = await renderToYaml(entryFile, { operatorsOnly: true });

        expect(yaml).toContain('Operator: test-operator');
        expect(yaml).toContain('kind: Namespace');
        expect(yaml).not.toContain('kind: Deployment');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should render only operators via renderToOperatorsYaml', async () => {
      const entryFile = join(testDir, 'r8s-operators-shorthand.js');
      writeFileSync(entryFile, jsContentWithOperator, 'utf-8');

      // Mock fetch
      const originalFetch = global.fetch;
      global.fetch = async () =>
        ({
          ok: true,
          text: async () => 'apiVersion: v1\nkind: Namespace\nmetadata:\n  name: test-operator-system',
        }) as Response;

      try {
        const yaml = await renderToOperatorsYaml(entryFile);

        expect(yaml).toContain('Operator: test-operator');
        expect(yaml).toContain('kind: Namespace');
        expect(yaml).not.toContain('kind: Deployment');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
