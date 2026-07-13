import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderToYaml } from '../src/renderer';
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
});
