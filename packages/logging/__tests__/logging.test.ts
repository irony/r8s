import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import { jsx } from '@r8s/core';
import { Logging, Flow, Output, loggingOperator } from '../src/index';

describe('Logging Operator', () => {
  it('should declare logging-operator', () => {
    const op = loggingOperator('4.2.3');
    expect(op.name).toBe('logging-operator');
    expect(op.source.type).toBe('helm');
    expect(op.source.chart).toBe('logging-operator');
  });
});

describe('Logging', () => {
  it('should render Logging resource', () => {
    const element = jsx(Logging, {
      name: 'platform-logs',
      namespace: 'logging',
      fluentd: { replicas: 2 },
    });

    const result = render(element);
    expect(result.resources).toHaveLength(1);

    const logging = result.resources[0];
    expect(logging.kind).toBe('Logging');
    expect(logging.apiVersion).toBe('logging.banzaicloud.io/v1beta1');
    expect((logging as any).spec.fluentd.replicas).toBe(2);
  });
});

describe('Flow', () => {
  it('should render Flow with output refs', () => {
    const element = jsx(Flow, {
      name: 'app-logs',
      namespace: 'production',
      outputRefs: ['loki-output'],
    });

    const result = render(element);
    expect(result.resources).toHaveLength(1);
    expect((result.resources[0] as any).spec.outputRefs).toContain('loki-output');
  });
});

describe('Output', () => {
  it('should render Output to Loki', () => {
    const element = jsx(Output, {
      name: 'loki-output',
      namespace: 'logging',
      loki: {
        url: 'http://loki.loki.svc:3100',
        configureKubernetesLabels: true,
      },
    });

    const result = render(element);
    expect(result.resources).toHaveLength(1);
    expect((result.resources[0] as any).spec.loki.url).toBe('http://loki.loki.svc:3100');
  });
});
