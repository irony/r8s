import { describe, it, expect } from 'vitest';
import {
  validateResource,
  validateIngress,
  validateService,
  validateDeployment,
  validateOperator,
  checkDuplicates,
  r8sValidationError,
} from '../src/validate';

describe('Resource Validation', () => {
  it('should catch missing apiVersion', () => {
    const resource = {
      kind: 'Deployment',
      metadata: { name: 'test' },
    } as any;

    const errors = validateResource(resource);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('MISSING_API_VERSION');
    expect(errors[0].message).toContain('missing apiVersion');
    expect(errors[0].suggestion).toContain('apps/v1');
  });

  it('should catch missing kind', () => {
    const resource = {
      apiVersion: 'v1',
      metadata: { name: 'test' },
    } as any;

    const errors = validateResource(resource);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('MISSING_KIND');
    expect(errors[0].message).toContain('missing kind');
    expect(errors[0].suggestion).toContain('Deployment');
  });

  it('should catch missing metadata', () => {
    const resource = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
    } as any;

    const errors = validateResource(resource);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('MISSING_METADATA');
    expect(errors[0].suggestion).toContain('metadata: { name:');
  });

  it('should catch missing name', () => {
    const resource = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {},
    } as any;

    const errors = validateResource(resource);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('MISSING_NAME');
    expect(errors[0].message).toContain('missing metadata.name');
  });

  it('should catch invalid DNS name', () => {
    const resource = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'Invalid_Name!' },
    } as any;

    const errors = validateResource(resource);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('INVALID_NAME');
    expect(errors[0].message).toContain('not a valid DNS subdomain name');
    expect(errors[0].suggestion).toContain('lowercase');
  });

  it('should catch empty namespace', () => {
    const resource = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: { name: 'test', namespace: '' },
    } as any;

    const errors = validateResource(resource);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('EMPTY_NAMESPACE');
    expect(errors[0].suggestion).toContain('omit namespace');
  });

  it('should pass valid resource', () => {
    const resource = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: 'my-app', namespace: 'production' },
    } as any;

    const errors = validateResource(resource);
    expect(errors).toHaveLength(0);
  });
});

describe('Ingress Validation', () => {
  it('should catch missing Ingress spec', () => {
    const ingress = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: { name: 'my-ingress' },
    } as any;

    const errors = validateIngress(ingress);
    expect(errors.some(e => e.code === 'MISSING_INGRESS_SPEC')).toBe(true);
    expect(errors.find(e => e.code === 'MISSING_INGRESS_SPEC')?.suggestion).toContain('rules');
  });

  it('should catch missing Ingress rules', () => {
    const ingress = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: { name: 'my-ingress' },
      spec: {},
    } as any;

    const errors = validateIngress(ingress);
    expect(errors.some(e => e.code === 'MISSING_INGRESS_RULES')).toBe(true);
    expect(errors.find(e => e.code === 'MISSING_INGRESS_RULES')?.suggestion).toContain('host');
  });

  it('should catch missing host in rule', () => {
    const ingress = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: { name: 'my-ingress' },
      spec: {
        rules: [{ http: { paths: [] } }],
      },
    } as any;

    const errors = validateIngress(ingress);
    expect(errors.some(e => e.code === 'MISSING_INGRESS_HOST')).toBe(true);
    expect(errors.find(e => e.code === 'MISSING_INGRESS_HOST')?.suggestion).toContain('app.example.com');
  });

  it('should catch missing paths in rule', () => {
    const ingress = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: { name: 'my-ingress' },
      spec: {
        rules: [{ host: 'example.com' }],
      },
    } as any;

    const errors = validateIngress(ingress);
    expect(errors.some(e => e.code === 'MISSING_INGRESS_PATHS')).toBe(true);
  });

  it('should catch missing TLS secret', () => {
    const ingress = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: { name: 'my-ingress' },
      spec: {
        rules: [{ host: 'example.com', http: { paths: [{ path: '/', backend: { service: { name: 'svc', port: { number: 80 } } } }] } }],
        tls: [{}],
      },
    } as any;

    const errors = validateIngress(ingress);
    expect(errors.some(e => e.code === 'MISSING_TLS_SECRET')).toBe(true);
    expect(errors.find(e => e.code === 'MISSING_TLS_SECRET')?.suggestion).toContain('cert-manager');
  });
});

describe('Service Validation', () => {
  it('should catch missing Service ports', () => {
    const service = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name: 'my-service' },
      spec: { selector: { app: 'test' } },
    } as any;

    const errors = validateService(service);
    expect(errors.some(e => e.code === 'MISSING_SERVICE_PORTS')).toBe(true);
    expect(errors.find(e => e.code === 'MISSING_SERVICE_PORTS')?.suggestion).toContain('port:');
  });

  it('should catch invalid port number', () => {
    const service = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name: 'my-service' },
      spec: {
        ports: [{ port: 70000 }],
      },
    } as any;

    const errors = validateService(service);
    expect(errors.some(e => e.code === 'INVALID_PORT')).toBe(true);
    expect(errors.find(e => e.code === 'INVALID_PORT')?.message).toContain('70000');
    expect(errors.find(e => e.code === 'INVALID_PORT')?.suggestion).toContain('65535');
  });

  it('should catch negative port', () => {
    const service = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name: 'my-service' },
      spec: {
        ports: [{ port: -1 }],
      },
    } as any;

    const errors = validateService(service);
    expect(errors.some(e => e.code === 'INVALID_PORT')).toBe(true);
  });
});

describe('Deployment Validation', () => {
  it('should catch missing Deployment spec', () => {
    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: 'my-app' },
    } as any;

    const errors = validateDeployment(deployment);
    expect(errors.some(e => e.code === 'MISSING_DEPLOYMENT_SPEC')).toBe(true);
  });

  it('should catch invalid replicas', () => {
    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: 'my-app' },
      spec: {
        replicas: -1,
        selector: { matchLabels: { app: 'test' } },
        template: { metadata: { labels: { app: 'test' } }, spec: { containers: [{ name: 'app', image: 'test' }] } },
      },
    } as any;

    const errors = validateDeployment(deployment);
    expect(errors.some(e => e.code === 'INVALID_REPLICAS')).toBe(true);
    expect(errors.find(e => e.code === 'INVALID_REPLICAS')?.message).toContain('-1');
  });

  it('should catch missing selector', () => {
    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: 'my-app' },
      spec: {
        template: { metadata: { labels: { app: 'test' } }, spec: { containers: [{ name: 'app', image: 'test' }] } },
      },
    } as any;

    const errors = validateDeployment(deployment);
    expect(errors.some(e => e.code === 'MISSING_SELECTOR')).toBe(true);
    expect(errors.find(e => e.code === 'MISSING_SELECTOR')?.suggestion).toContain('matchLabels');
  });

  it('should catch missing containers', () => {
    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: 'my-app' },
      spec: {
        selector: { matchLabels: { app: 'test' } },
        template: { metadata: { labels: { app: 'test' } }, spec: {} },
      },
    } as any;

    const errors = validateDeployment(deployment);
    expect(errors.some(e => e.code === 'MISSING_CONTAINERS')).toBe(true);
    expect(errors.find(e => e.code === 'MISSING_CONTAINERS')?.suggestion).toContain('image');
  });
});

describe('Operator Validation', () => {
  it('should catch missing operator name', () => {
    const op = { version: '1.0.0', source: { type: 'helm' } };
    const errors = validateOperator(op);
    expect(errors.some(e => e.code === 'MISSING_OPERATOR_NAME')).toBe(true);
    expect(errors.find(e => e.code === 'MISSING_OPERATOR_NAME')?.suggestion).toContain('cnpg');
  });

  it('should catch missing operator version', () => {
    const op = { name: 'test-operator', source: { type: 'helm' } };
    const errors = validateOperator(op);
    expect(errors.some(e => e.code === 'MISSING_OPERATOR_VERSION')).toBe(true);
  });

  it('should catch invalid semver', () => {
    const op = { name: 'test-operator', version: 'latest', source: { type: 'helm' } };
    const errors = validateOperator(op);
    expect(errors.some(e => e.code === 'INVALID_SEMVER')).toBe(true);
    expect(errors.find(e => e.code === 'INVALID_SEMVER')?.message).toContain('latest');
    expect(errors.find(e => e.code === 'INVALID_SEMVER')?.suggestion).toContain('1.22.5');
  });

  it('should catch missing operator source', () => {
    const op = { name: 'test-operator', version: '1.0.0' };
    const errors = validateOperator(op);
    expect(errors.some(e => e.code === 'MISSING_OPERATOR_SOURCE')).toBe(true);
    expect(errors.find(e => e.code === 'MISSING_OPERATOR_SOURCE')?.suggestion).toContain('manifest');
  });

  it('should pass valid operator', () => {
    const op = {
      name: 'cert-manager',
      version: '1.14.0',
      source: { type: 'helm', chart: 'cert-manager', repository: 'https://charts.jetstack.io' },
    };
    const errors = validateOperator(op);
    expect(errors).toHaveLength(0);
  });
});

describe('Duplicate Detection', () => {
  it('should catch duplicate resources', () => {
    const resources = [
      { apiVersion: 'v1', kind: 'Service', metadata: { name: 'api', namespace: 'production' } },
      { apiVersion: 'v1', kind: 'Service', metadata: { name: 'api', namespace: 'production' } },
      { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'api', namespace: 'production' } },
    ] as any[];

    const errors = checkDuplicates(resources);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('DUPLICATE_RESOURCE');
    expect(errors[0].message).toContain('Service "api"');
    expect(errors[0].message).toContain('2 times');
    expect(errors[0].suggestion).toContain('unique name');
  });

  it('should allow same name in different namespaces', () => {
    const resources = [
      { apiVersion: 'v1', kind: 'Service', metadata: { name: 'api', namespace: 'staging' } },
      { apiVersion: 'v1', kind: 'Service', metadata: { name: 'api', namespace: 'production' } },
    ] as any[];

    const errors = checkDuplicates(resources);
    expect(errors).toHaveLength(0);
  });

  it('should allow same name for different kinds', () => {
    const resources = [
      { apiVersion: 'v1', kind: 'Service', metadata: { name: 'api', namespace: 'default' } },
      { apiVersion: 'v1', kind: 'Deployment', metadata: { name: 'api', namespace: 'default' } },
    ] as any[];

    const errors = checkDuplicates(resources);
    expect(errors).toHaveLength(0);
  });
});

describe('r8sValidationError', () => {
  it('should format multiple errors', () => {
    const errors = [
      { code: 'MISSING_NAME', message: 'Missing name' },
      { code: 'INVALID_PORT', message: 'Invalid port' },
    ];

    const error = new r8sValidationError(errors);
    expect(error.message).toContain('[MISSING_NAME]');
    expect(error.message).toContain('Missing name');
    expect(error.message).toContain('[INVALID_PORT]');
    expect(error.message).toContain('Invalid port');
    expect(error.errors).toHaveLength(2);
  });
});
