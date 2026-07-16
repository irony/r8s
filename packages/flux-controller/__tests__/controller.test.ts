import { describe, it, expect } from 'vitest';
import { resourcesToYAML, findEntryFiles } from '../src/controller';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('resourcesToYAML', () => {
  it('should convert simple resource to YAML', () => {
    const resources = [{
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: { name: 'test', namespace: 'default' },
      data: { key: 'value' },
    }];

    const yaml = resourcesToYAML(resources);
    expect(yaml).toContain('apiVersion: v1');
    expect(yaml).toContain('kind: ConfigMap');
    expect(yaml).toContain('name: test');
    expect(yaml).toContain('key: value');
    expect(yaml).toContain('---');
  });

  it('should handle arrays', () => {
    const resources = [{
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name: 'test' },
      spec: {
        ports: [{ port: 80, targetPort: 8080 }],
      },
    }];

    const yaml = resourcesToYAML(resources);
    expect(yaml).toContain('ports:');
    expect(yaml).toContain('port: 80');
    expect(yaml).toContain('targetPort: 8080');
  });

  it('should handle empty resources', () => {
    const yaml = resourcesToYAML([]);
    expect(yaml).toContain('No resources generated');
  });

  it('should handle multiple resources', () => {
    const resources = [
      { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'cm1' } },
      { apiVersion: 'v1', kind: 'Secret', metadata: { name: 'secret1' } },
    ];

    const yaml = resourcesToYAML(resources);
    const separators = yaml.match(/---/g);
    expect(separators).toHaveLength(2);
  });

  it('should quote strings with special characters', () => {
    const resources = [{
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: { name: 'test' },
      data: { url: 'http://example.com:8080/path' },
    }];

    const yaml = resourcesToYAML(resources);
    expect(yaml).toContain('"http://example.com:8080/path"');
  });
});

describe('findEntryFiles', () => {
  it('should find r8s.tsx files', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'r8s-test-'));
    
    // Create test structure
    mkdirSync(join(tmpDir, 'apps', 'web'), { recursive: true });
    mkdirSync(join(tmpDir, 'apps', 'api'), { recursive: true });
    mkdirSync(join(tmpDir, 'node_modules'), { recursive: true });
    
    writeFileSync(join(tmpDir, 'apps', 'web', 'r8s.tsx'), 'export default () => {}');
    writeFileSync(join(tmpDir, 'apps', 'api', 'r8s.tsx'), 'export default () => {}');
    writeFileSync(join(tmpDir, 'apps', 'other.tsx'), 'export default () => {}');
    writeFileSync(join(tmpDir, 'node_modules', 'r8s.tsx'), 'export default () => {}');
    
    const files = findEntryFiles(tmpDir, 'r8s.tsx');
    
    expect(files).toHaveLength(2);
    expect(files.some(f => f.includes('apps/web/r8s.tsx'))).toBe(true);
    expect(files.some(f => f.includes('apps/api/r8s.tsx'))).toBe(true);
    expect(files.some(f => f.includes('node_modules'))).toBe(false);
    
    // Cleanup
    rmSync(tmpDir, { recursive: true });
  });

  it('should return empty array for non-existent directory', () => {
    const files = findEntryFiles('/non-existent/path');
    expect(files).toHaveLength(0);
  });
});
