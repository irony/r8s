import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import { jsx } from '@r8s/core';
import {
  VaultConnectionConfig,
  VaultKubernetesAuth,
  VaultDatabaseSecret,
  VaultKVSecret,
} from '../src/index';

describe('VaultConnectionConfig', () => {
  it('should render VaultConnection', () => {
    const element = jsx(VaultConnectionConfig, {
      name: 'vault-prod',
      namespace: 'vault',
      address: 'https://vault.example.com:8200',
      caCertSecretRef: 'vault-ca-cert',
      skipTLSVerify: false,
    });

    const result = render(element);

    expect(result.resources).toHaveLength(1);
    const conn = result.resources[0];
    expect(conn.kind).toBe('VaultConnection');
    expect(conn.apiVersion).toBe('secrets.hashicorp.com/v1beta1');
    expect(conn.metadata.name).toBe('vault-prod');
    expect(conn.metadata.namespace).toBe('vault');
    expect((conn as any).spec.address).toBe('https://vault.example.com:8200');
    expect((conn as any).spec.caCertSecretRef).toBe('vault-ca-cert');
    expect((conn as any).spec.skipTLSVerify).toBe(false);
  });

  it('should use defaults', () => {
    const element = jsx(VaultConnectionConfig, {
      name: 'vault-default',
      address: 'https://vault.internal:8200',
    });

    const result = render(element);

    const conn = result.resources[0];
    expect(conn.metadata.namespace).toBe('default');
    expect((conn as any).spec.skipTLSVerify).toBe(false);
  });
});

describe('VaultKubernetesAuth', () => {
  it('should render VaultAuth with Kubernetes method', () => {
    const element = jsx(VaultKubernetesAuth, {
      name: 'app-auth',
      namespace: 'production',
      vaultConnectionRef: 'vault-prod',
      role: 'app-role',
      serviceAccount: 'app-sa',
      mount: 'kubernetes',
    });

    const result = render(element);

    expect(result.resources).toHaveLength(1);
    const auth = result.resources[0];
    expect(auth.kind).toBe('VaultAuth');
    expect(auth.apiVersion).toBe('secrets.hashicorp.com/v1beta1');
    expect(auth.metadata.name).toBe('app-auth');
    expect(auth.metadata.namespace).toBe('production');
    expect((auth as any).spec.method).toBe('kubernetes');
    expect((auth as any).spec.mount).toBe('kubernetes');
    expect((auth as any).spec.kubernetes.role).toBe('app-role');
    expect((auth as any).spec.kubernetes.serviceAccount).toBe('app-sa');
    expect((auth as any).spec.vaultConnectionRef).toBe('vault-prod');
  });
});

describe('VaultDatabaseSecret', () => {
  it('should render VaultDynamicSecret', () => {
    const element = jsx(VaultDatabaseSecret, {
      name: 'db-credentials',
      namespace: 'production',
      vaultAuthRef: 'app-auth',
      mount: 'database',
      path: 'creds/app-db',
      secretName: 'app-db-credentials',
      rolloutRestartTarget: { kind: 'Deployment', name: 'app' },
    });

    const result = render(element);

    expect(result.resources).toHaveLength(1);
    const secret = result.resources[0];
    expect(secret.kind).toBe('VaultDynamicSecret');
    expect(secret.apiVersion).toBe('secrets.hashicorp.com/v1beta1');
    expect(secret.metadata.name).toBe('db-credentials');
    expect((secret as any).spec.vaultAuthRef).toBe('app-auth');
    expect((secret as any).spec.mount).toBe('database');
    expect((secret as any).spec.path).toBe('creds/app-db');
    expect((secret as any).spec.destination.name).toBe('app-db-credentials');
    expect((secret as any).spec.destination.create).toBe(true);
    expect((secret as any).spec.rolloutRestartTargets).toEqual([{ kind: 'Deployment', name: 'app' }]);
  });
});

describe('VaultKVSecret', () => {
  it('should render VaultStaticSecret for KV v2', () => {
    const element = jsx(VaultKVSecret, {
      name: 'app-config',
      namespace: 'production',
      vaultAuthRef: 'app-auth',
      mount: 'secret',
      path: 'app/config',
      secretName: 'app-config-secret',
      type: 'kv-v2',
    });

    const result = render(element);

    expect(result.resources).toHaveLength(1);
    const secret = result.resources[0];
    expect(secret.kind).toBe('VaultStaticSecret');
    expect(secret.apiVersion).toBe('secrets.hashicorp.com/v1beta1');
    expect((secret as any).spec.type).toBe('kv-v2');
    expect((secret as any).spec.path).toBe('app/config');
    expect((secret as any).spec.destination.name).toBe('app-config-secret');
  });

  it('should default to kv-v2', () => {
    const element = jsx(VaultKVSecret, {
      name: 'default-kv',
      namespace: 'default',
      vaultAuthRef: 'auth',
      mount: 'secret',
      path: 'test',
      secretName: 'test-secret',
    });

    const result = render(element);

    const secret = result.resources[0];
    expect((secret as any).spec.type).toBe('kv-v2');
  });
});
