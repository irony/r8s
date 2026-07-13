import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import { Postgres, CustomIngress } from '../src/index';
import { jsx, Fragment } from '@r8s/core';

describe('Postgres Recipe (CNPG)', () => {
  it('should render CNPG Cluster and Secret', () => {
    const element = jsx(Postgres, {
      name: 'test-db',
      namespace: 'test-ns',
      database: 'mydb',
      user: 'myuser',
      password: 'mypass',
      storage: '5Gi',
    });

    const result = render(element);

    expect(result.resources).toHaveLength(2);

    // CNPG Cluster
    const cluster = result.resources[0];
    expect(cluster.kind).toBe('Cluster');
    expect(cluster.apiVersion).toBe('postgresql.cnpg.io/v1');
    expect(cluster.metadata.name).toBe('test-db');
    expect(cluster.metadata.namespace).toBe('test-ns');
    expect((cluster as any).spec.instances).toBe(3);
    expect((cluster as any).spec.storage.size).toBe('5Gi');
    expect((cluster as any).spec.bootstrap.initdb.database).toBe('mydb');
    expect((cluster as any).spec.bootstrap.initdb.owner).toBe('myuser');

    // Secret with credentials
    const secret = result.resources[1];
    expect(secret.kind).toBe('Secret');
    expect(secret.metadata.name).toBe('test-db-credentials');
    expect(secret.metadata.namespace).toBe('test-ns');
  });

  it('should use default values', () => {
    const element = jsx(Postgres, { name: 'default-db' });
    const result = render(element);

    const cluster = result.resources[0];
    expect(cluster.metadata.namespace).toBe('default');
    expect((cluster as any).spec.instances).toBe(3);
    expect((cluster as any).spec.storage.size).toBe('10Gi');
    expect((cluster as any).spec.imageName).toBe('ghcr.io/cloudnative-pg/postgresql:16.2');
  });

  it('should not create Secret when passwordSecretName is provided', () => {
    const element = jsx(Postgres, {
      name: 'external-secret-db',
      passwordSecretName: 'my-existing-secret',
    });

    const result = render(element);

    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].kind).toBe('Cluster');
    expect((result.resources[0] as any).spec.bootstrap.initdb.secret.name).toBe('my-existing-secret');
  });

  it('should include Pooler when enabled', () => {
    const element = jsx(Postgres, {
      name: 'pooled-db',
      enablePooler: true,
      poolerInstances: 3,
      poolMode: 'session',
    });

    const result = render(element);

    expect(result.resources).toHaveLength(2);
    expect(result.resources[0].kind).toBe('Cluster');
    expect(result.resources[1].kind).toBe('Pooler');
    expect((result.resources[1] as any).spec.instances).toBe(3);
    expect((result.resources[1] as any).spec.pgbouncer.poolMode).toBe('session');
  });

  it('should include ScheduledBackup when enabled', () => {
    const element = jsx(Postgres, {
      name: 'backup-db',
      password: 'secret',
      enableBackup: true,
      backupSchedule: '0 3 * * *',
      backupRetention: '14d',
    });

    const result = render(element);

    expect(result.resources).toHaveLength(3);
    expect(result.resources[0].kind).toBe('Cluster');
    expect(result.resources[1].kind).toBe('Secret');
    expect(result.resources[2].kind).toBe('ScheduledBackup');
    expect((result.resources[2] as any).spec.schedule).toBe('0 3 * * *');
  });
});

describe('CustomIngress Recipe', () => {
  it('should render Ingress with TLS', () => {
    const element = jsx(CustomIngress, {
      name: 'test-ingress',
      namespace: 'test-ns',
      host: 'test.example.com',
      serviceName: 'test-svc',
      servicePort: 8080,
      tlsSecretName: 'test-tls',
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
    const element = jsx(CustomIngress, {
      name: 'simple-ingress',
      host: 'simple.example.com',
      serviceName: 'simple-svc',
    });

    const result = render(element);
    const spec = (result.resources[0] as any).spec;

    expect(spec.tls).toBeUndefined();
  });

  it('should merge custom annotations with defaults', () => {
    const element = jsx(CustomIngress, {
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
});
