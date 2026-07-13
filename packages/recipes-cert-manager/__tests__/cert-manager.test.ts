import { describe, it, expect } from 'vitest';
import { render } from '@reactnetes/core';
import { jsx } from '@reactnetes/core';
import { LetsEncryptIssuer, ManagedCertificate } from '../src/index';

describe('LetsEncryptIssuer', () => {
  it('should render production ClusterIssuer', () => {
    const element = jsx(LetsEncryptIssuer, {
      name: 'letsencrypt-prod',
      email: 'admin@example.com',
      server: 'production',
      ingressClass: 'nginx',
    });

    const result = render(element);

    expect(result.resources).toHaveLength(1);
    const issuer = result.resources[0];
    expect(issuer.kind).toBe('ClusterIssuer');
    expect(issuer.apiVersion).toBe('cert-manager.io/v1');
    expect(issuer.metadata.name).toBe('letsencrypt-prod');
    expect((issuer as any).spec.acme.server).toBe('https://acme-v02.api.letsencrypt.org/directory');
    expect((issuer as any).spec.acme.email).toBe('admin@example.com');
    expect((issuer as any).spec.acme.privateKeySecretRef.name).toBe('letsencrypt-prod-account-key');
    expect((issuer as any).spec.acme.solvers[0].http01.ingress.class).toBe('nginx');
  });

  it('should render staging ClusterIssuer', () => {
    const element = jsx(LetsEncryptIssuer, {
      name: 'letsencrypt-staging',
      email: 'admin@example.com',
      server: 'staging',
    });

    const result = render(element);

    const issuer = result.resources[0];
    expect((issuer as any).spec.acme.server).toBe('https://acme-staging-v02.api.letsencrypt.org/directory');
  });

  it('should use default ingress class', () => {
    const element = jsx(LetsEncryptIssuer, {
      name: 'letsencrypt-prod',
      email: 'admin@example.com',
    });

    const result = render(element);

    const issuer = result.resources[0];
    expect((issuer as any).spec.acme.solvers[0].http01.ingress.class).toBe('nginx');
  });
});

describe('ManagedCertificate', () => {
  it('should render Certificate with TLS', () => {
    const element = jsx(ManagedCertificate, {
      name: 'app-tls',
      namespace: 'production',
      secretName: 'app-tls-secret',
      issuerName: 'letsencrypt-prod',
      dnsNames: ['app.example.com', '*.app.example.com'],
      duration: '2160h',
      renewBefore: '360h',
    });

    const result = render(element);

    expect(result.resources).toHaveLength(1);
    const cert = result.resources[0];
    expect(cert.kind).toBe('Certificate');
    expect(cert.apiVersion).toBe('cert-manager.io/v1');
    expect(cert.metadata.name).toBe('app-tls');
    expect(cert.metadata.namespace).toBe('production');
    expect((cert as any).spec.secretName).toBe('app-tls-secret');
    expect((cert as any).spec.issuerRef.name).toBe('letsencrypt-prod');
    expect((cert as any).spec.issuerRef.kind).toBe('ClusterIssuer');
    expect((cert as any).spec.dnsNames).toEqual(['app.example.com', '*.app.example.com']);
    expect((cert as any).spec.duration).toBe('2160h');
    expect((cert as any).spec.renewBefore).toBe('360h');
  });

  it('should use default namespace and durations', () => {
    const element = jsx(ManagedCertificate, {
      name: 'simple-cert',
      secretName: 'simple-tls',
      issuerName: 'letsencrypt-prod',
      dnsNames: ['example.com'],
    });

    const result = render(element);

    const cert = result.resources[0];
    expect(cert.metadata.namespace).toBe('default');
    expect((cert as any).spec.duration).toBe('2160h');
    expect((cert as any).spec.renewBefore).toBe('360h');
  });
});
