import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import { jsx } from '@r8s/core';
import { ServiceMonitor, PrometheusRule, PodMonitor, prometheusOperator } from '../src/index';

describe('Prometheus Operator', () => {
  it('should declare prometheus operator', () => {
    const op = prometheusOperator('0.72.0');
    expect(op.name).toBe('prometheus');
    expect(op.source.type).toBe('helm');
    expect(op.source.chart).toBe('kube-prometheus-stack');
    expect(op.source.repository).toBe('https://prometheus-community.github.io/helm-charts');
  });
});

describe('ServiceMonitor', () => {
  it('should render ServiceMonitor', () => {
    const element = jsx(ServiceMonitor, {
      name: 'api-metrics',
      namespace: 'production',
      selector: { matchLabels: { app: 'api' } },
      endpoints: [
        { port: 'metrics', path: '/metrics', interval: '30s' },
      ],
    });

    const result = render(element);
    expect(result.resources).toHaveLength(1);

    const monitor = result.resources[0];
    expect(monitor.kind).toBe('ServiceMonitor');
    expect(monitor.apiVersion).toBe('monitoring.coreos.com/v1');
    expect(monitor.metadata.name).toBe('api-metrics');
    expect((monitor as any).spec.selector.matchLabels.app).toBe('api');
    expect((monitor as any).spec.endpoints[0].port).toBe('metrics');
    expect((monitor as any).spec.endpoints[0].path).toBe('/metrics');
  });
});

describe('PrometheusRule', () => {
  it('should render PrometheusRule with alerts', () => {
    const element = jsx(PrometheusRule, {
      name: 'api-alerts',
      namespace: 'production',
      groups: [
        {
          name: 'api',
          rules: [
            {
              alert: 'HighErrorRate',
              expr: 'rate(http_requests_total{status=~"5.."}[5m]) > 0.1',
              for: '5m',
              labels: { severity: 'critical' },
              annotations: {
                summary: 'High error rate detected',
              },
            },
          ],
        },
      ],
    });

    const result = render(element);
    expect(result.resources).toHaveLength(1);

    const rule = result.resources[0] as any;
    expect(rule.kind).toBe('PrometheusRule');
    expect(rule.spec.groups[0].rules[0].alert).toBe('HighErrorRate');
    expect(rule.spec.groups[0].rules[0].expr).toContain('rate');
  });
});

describe('PodMonitor', () => {
  it('should render PodMonitor', () => {
    const element = jsx(PodMonitor, {
      name: 'sidecar-metrics',
      namespace: 'production',
      selector: { matchLabels: { app: 'worker' } },
      podMetricsEndpoints: [
        { port: 'metrics', path: '/metrics', interval: '15s' },
      ],
    });

    const result = render(element);
    expect(result.resources).toHaveLength(1);

    const monitor = result.resources[0] as any;
    expect(monitor.kind).toBe('PodMonitor');
    expect(monitor.spec.podMetricsEndpoints[0].port).toBe('metrics');
  });
});
