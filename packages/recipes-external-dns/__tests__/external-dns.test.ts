import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import { jsx } from '@r8s/core';
import { ExternalDNSRecord, externalDNSAnnotations } from '../src/index';

describe('ExternalDNSRecord', () => {
  it('should render DNSEndpoint with A record', () => {
    const element = jsx(ExternalDNSRecord, {
      name: 'app-dns',
      namespace: 'production',
      dnsName: 'app.example.com',
      targets: ['192.168.1.100', '192.168.1.101'],
      recordType: 'A',
      ttl: 300,
    });

    const result = render(element);

    expect(result.resources).toHaveLength(1);
    const endpoint = result.resources[0];
    expect(endpoint.kind).toBe('DNSEndpoint');
    expect(endpoint.apiVersion).toBe('externaldns.k8s.io/v1alpha1');
    expect(endpoint.metadata.name).toBe('app-dns');
    expect(endpoint.metadata.namespace).toBe('production');
    expect((endpoint as any).spec.endpoints).toHaveLength(1);
    expect((endpoint as any).spec.endpoints[0].dnsName).toBe('app.example.com');
    expect((endpoint as any).spec.endpoints[0].recordType).toBe('A');
    expect((endpoint as any).spec.endpoints[0].targets).toEqual(['192.168.1.100', '192.168.1.101']);
    expect((endpoint as any).spec.endpoints[0].recordTTL).toBe(300);
  });

  it('should render CNAME record with defaults', () => {
    const element = jsx(ExternalDNSRecord, {
      name: 'www-dns',
      dnsName: 'www.example.com',
      targets: ['app.example.com'],
    });

    const result = render(element);

    const endpoint = result.resources[0];
    expect(endpoint.metadata.namespace).toBe('default');
    expect((endpoint as any).spec.endpoints[0].recordType).toBe('A');
    expect((endpoint as any).spec.endpoints[0].recordTTL).toBe(300);
  });
});

describe('externalDNSAnnotations', () => {
  it('should return ingress annotations for external-dns', () => {
    const annotations = externalDNSAnnotations({
      domain: 'app.example.com',
      targets: ['192.168.1.100'],
    });

    expect(annotations).toEqual({
      'external-dns.alpha.kubernetes.io/hostname': 'app.example.com',
      'external-dns.alpha.kubernetes.io/target': '192.168.1.100',
    });
  });

  it('should join multiple targets', () => {
    const annotations = externalDNSAnnotations({
      domain: 'app.example.com',
      targets: ['192.168.1.100', '192.168.1.101'],
    });

    expect(annotations['external-dns.alpha.kubernetes.io/target']).toBe('192.168.1.100,192.168.1.101');
  });
});
