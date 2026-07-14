import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import { jsx } from '@r8s/core';
import { Gateway, HTTPRoute, EnvoyProxy, envoyGatewayOperator } from '../src/index';

describe('Envoy Gateway Operator', () => {
  it('should declare envoy-gateway operator', () => {
    const op = envoyGatewayOperator('1.7.0');
    expect(op.name).toBe('envoy-gateway');
    expect(op.source.type).toBe('helm');
    expect(op.source.chart).toBe('gateway-helm');
    expect(op.source.repository).toBe('oci://docker.io/envoyproxy');
  });
});

describe('Gateway', () => {
  it('should render Gateway with listeners', () => {
    const element = jsx(Gateway, {
      name: 'public-gateway',
      namespace: 'envoy-gateway-system',
      gatewayClassName: 'eg',
      listeners: [
        { name: 'https', protocol: 'HTTPS', port: 443, hostname: 'api.example.com' },
        { name: 'http', protocol: 'HTTP', port: 80 },
      ],
    });

    const result = render(element);
    expect(result.resources).toHaveLength(1);

    const gw = result.resources[0];
    expect(gw.kind).toBe('Gateway');
    expect(gw.apiVersion).toBe('gateway.networking.k8s.io/v1');
    expect(gw.metadata.name).toBe('public-gateway');
    expect((gw as any).spec.gatewayClassName).toBe('eg');
    expect((gw as any).spec.listeners).toHaveLength(2);
    expect((gw as any).spec.listeners[0].protocol).toBe('HTTPS');
  });
});

describe('HTTPRoute', () => {
  it('should render HTTPRoute with backend refs', () => {
    const element = jsx(HTTPRoute, {
      name: 'api-routes',
      namespace: 'production',
      parentRefs: [{ name: 'public-gateway', namespace: 'envoy-gateway-system' }],
      hostnames: ['api.example.com'],
      rules: [
        {
          matches: [{ path: { type: 'PathPrefix', value: '/v1' } }],
          backendRefs: [{ name: 'api-service', port: 8080 }],
        },
      ],
    });

    const result = render(element);
    expect(result.resources).toHaveLength(1);

    const route = result.resources[0];
    expect(route.kind).toBe('HTTPRoute');
    expect((route as any).spec.hostnames).toContain('api.example.com');
    expect((route as any).spec.rules[0].backendRefs[0].name).toBe('api-service');
  });
});

describe('EnvoyProxy', () => {
  it('should render EnvoyProxy with mergeGateways', () => {
    const element = jsx(EnvoyProxy, {
      name: 'shared-proxy',
      namespace: 'envoy-gateway-system',
      mergeGateways: true,
    });

    const result = render(element);
    expect(result.resources).toHaveLength(1);

    const proxy = result.resources[0] as any;
    expect(proxy.kind).toBe('EnvoyProxy');
    expect(proxy.spec.mergeGateways).toBe(true);
  });
});
