import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import { Database, Ingress, WebService, App } from '../src/index';
import { cnpgOperator, nginxIngressOperator } from '../src/operators';
import { jsx, Fragment } from '@r8s/core';
import { certManagerOperator } from '@r8s/cert-manager';
import { OperatorContext } from '@r8s/core/defaults';

describe('Database Recipe (CNPG)', () => {
  it('should render CNPG Cluster', () => {
    const element = jsx(Database, {
      name: 'test-db',
      namespace: 'test-ns',
      storage: '5Gi',
    });

    const result = render(element);

    expect(result.resources).toHaveLength(1);

    // CNPG Cluster
    const cluster = result.resources[0];
    expect(cluster.kind).toBe('Cluster');
    expect(cluster.apiVersion).toBe('postgresql.cnpg.io/v1');
    expect(cluster.metadata.name).toBe('test-db');
    expect(cluster.metadata.namespace).toBe('test-ns');
    expect((cluster as any).spec.instances).toBe(3);
    expect((cluster as any).spec.storage.size).toBe('5Gi');
    expect((cluster as any).spec.bootstrap.initdb.database).toBe('test-db');
    expect((cluster as any).spec.bootstrap.initdb.owner).toBe('test-db');
  });

  it('should use default values', () => {
    const element = jsx(Database, { name: 'default-db' });
    const result = render(element);

    const cluster = result.resources[0];
    expect(cluster.metadata.namespace).toBe('default');
    expect((cluster as any).spec.instances).toBe(3);
    expect((cluster as any).spec.storage.size).toBe('10Gi');
  });

  it('should set DatabaseContext for child components', () => {
    const element = jsx(Database, {
      name: 'context-db',
      storage: '10Gi',
    });

    const result = render(element);
    expect(result.resources.length).toBeGreaterThanOrEqual(1);
    expect(result.resources[0].kind).toBe('Cluster');
  });

  it('should declare CNPG operator dependency', () => {
    const element = jsx(Database, { name: 'test-db' });
    const result = render(element);

    expect(result.operators).toHaveLength(1);
    expect(result.operators[0].name).toBe('cnpg');
    expect(result.operators[0].source.type).toBe('manifest');
    expect(result.operators[0].source.url).toContain('cloudnative-pg');
  });

  it('should not duplicate CNPG operator when provided via context', () => {
    const element = jsx(OperatorContext.Provider, {
      value: [cnpgOperator('1.22.5')],
      children: jsx(Database, { name: 'test-db' }),
    });

    const result = render(element);

    expect(result.operators).toHaveLength(1);
    expect(result.operators[0].name).toBe('cnpg');
  });

  it('should allow operator version override', () => {
    const element = jsx(Database, {
      name: 'test-db',
      operatorVersion: '1.23.0',
    });

    const result = render(element);

    expect(result.operators[0].version).toBe('1.23.0');
  });
});

describe('Ingress Recipe', () => {
  it('should render Ingress with TLS', () => {
    const element = jsx(Ingress, {
      name: 'test-ingress',
      namespace: 'test-ns',
      host: 'test.example.com',
      serviceName: 'test-svc',
      servicePort: 8080,
      tls: { secretName: 'test-tls', clusterIssuer: 'letsencrypt' },
    });

    const result = render(element);

    expect(result.resources).toHaveLength(1);

    const ingress = result.resources[0];
    expect(ingress.kind).toBe('Ingress');
    expect(ingress.metadata.name).toBe('test-ingress');
    expect(ingress.metadata.annotations).toHaveProperty('nginx.ingress.kubernetes.io/rewrite-target');
    expect(ingress.metadata.annotations).toHaveProperty('cert-manager.io/cluster-issuer');

    const spec = (ingress as any).spec;
    expect(spec.ingressClassName).toBe('nginx');
    expect(spec.rules[0].host).toBe('test.example.com');
    expect(spec.rules[0].http.paths[0].backend.service.name).toBe('test-svc');
    expect(spec.rules[0].http.paths[0].backend.service.port.number).toBe(8080);
    expect(spec.tls[0].secretName).toBe('test-tls');
  });

  it('should render Ingress without TLS when not specified', () => {
    const element = jsx(Ingress, {
      name: 'simple-ingress',
      host: 'simple.example.com',
      serviceName: 'simple-svc',
    });

    const result = render(element);
    const spec = (result.resources[0] as any).spec;

    expect(spec.tls).toBeUndefined();
  });

  it('should merge custom annotations with defaults', () => {
    const element = jsx(Ingress, {
      name: 'annotated-ingress',
      host: 'app.example.com',
      serviceName: 'app-svc',
      annotations: {
        'custom.annotation/key': 'value',
      },
    });

    const result = render(element);
    const annotations = result.resources[0].metadata.annotations;

    expect(annotations).toHaveProperty('nginx.ingress.kubernetes.io/rewrite-target');
    expect(annotations).toHaveProperty('custom.annotation/key', 'value');
  });

  it('should declare nginx-ingress operator', () => {
    const element = jsx(Ingress, {
      name: 'test-ingress',
      host: 'test.example.com',
      serviceName: 'test-svc',
    });

    const result = render(element);

    expect(result.operators).toHaveLength(1);
    expect(result.operators[0].name).toBe('nginx-ingress');
  });

  it('should declare cert-manager operator when TLS is enabled', () => {
    const element = jsx(Ingress, {
      name: 'test-ingress',
      host: 'test.example.com',
      serviceName: 'test-svc',
      tls: { secretName: 'test-tls' },
    });

    const result = render(element);

    expect(result.operators).toHaveLength(2);
    const names = result.operators.map(op => op.name);
    expect(names).toContain('nginx-ingress');
    expect(names).toContain('cert-manager');
  });

  it('should not duplicate operators when provided via context', () => {
    const element = jsx(OperatorContext.Provider, {
      value: [
        nginxIngressOperator('1.15.1'),
        certManagerOperator('1.14.0'),
      ],
      children: jsx(Ingress, {
        name: 'test-ingress',
        host: 'test.example.com',
        serviceName: 'test-svc',
      tls: { secretName: 'test-tls', clusterIssuer: 'letsencrypt' },
      }),
    });

    const result = render(element);

    expect(result.operators).toHaveLength(2);
  });
});

describe('WebService Recipe', () => {
  it('should render Deployment and Service', () => {
    const element = jsx(WebService, {
      name: 'api',
      image: 'myapp/api:v1',
      port: 3000,
      replicas: 3,
    });

    const result = render(element);

    expect(result.resources).toHaveLength(2);
    expect(result.resources[0].kind).toBe('Deployment');
    expect(result.resources[1].kind).toBe('Service');
  });
});

describe('App Recipe', () => {
  it('should render app with deployment, service, and ingress', () => {
    const element = jsx(App, {
      name: 'myapp',
      host: 'myapp.example.com',
      image: 'myapp:v1',
    });

    const result = render(element);

    expect(result.resources.length).toBeGreaterThanOrEqual(2);
    const kinds = result.resources.map((r: any) => r.kind);
    expect(kinds).toContain('Deployment');
    expect(kinds).toContain('Service');
    expect(kinds).toContain('Ingress');
  });

  it('should declare nginx-ingress operator', () => {
    const element = jsx(App, {
      name: 'myapp',
      host: 'myapp.example.com',
      image: 'myapp:v1',
    });

    const result = render(element);

    const names = result.operators.map(op => op.name);
    expect(names).toContain('nginx-ingress');
  });

  it('should declare cert-manager when TLS is configured', () => {
    const element = jsx(App, {
      name: 'myapp',
      host: 'myapp.example.com',
      image: 'myapp:v1',
      tls: { secretName: 'myapp-tls', clusterIssuer: 'letsencrypt' },
    });

    const result = render(element);

    const names = result.operators.map(op => op.name);
    expect(names).toContain('cert-manager');
    expect(names).toContain('nginx-ingress');
  });

  it('should not declare cert-manager when TLS is disabled', () => {
    const element = jsx(App, {
      name: 'myapp',
      host: 'myapp.example.com',
      image: 'myapp:v1',
    });

    const result = render(element);

    const names = result.operators.map(op => op.name);
    expect(names).not.toContain('cert-manager');
    expect(names).toContain('nginx-ingress');
  });

  it('should use shared operators from context without duplication', () => {
    const element = jsx(OperatorContext.Provider, {
      value: [
        certManagerOperator('1.14.0'),
        nginxIngressOperator('1.15.1'),
      ],
      children: jsx(App, {
        name: 'myapp',
        host: 'myapp.example.com',
        image: 'myapp:v1',
        tls: { secretName: 'myapp-tls', clusterIssuer: 'letsencrypt' },
      }),
    });

    const result = render(element);

    expect(result.operators).toHaveLength(2);
  });
});
