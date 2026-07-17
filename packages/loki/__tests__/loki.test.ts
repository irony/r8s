import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import { jsx } from '@r8s/core';
import { LokiStack, AlertingRule, lokiOperator } from '../src/index';

describe('Loki Operator', () => {
  it('should declare loki operator', () => {
    const op = lokiOperator('5.47.0');
    expect(op.name).toBe('loki');
    expect(op.source.type).toBe('helm');
    expect(op.source.chart).toBe('loki');
  });
});

describe('LokiStack', () => {
  it('should render LokiStack with S3 storage', () => {
    const element = jsx(LokiStack, {
      name: 'loki',
      namespace: 'loki',
      storage: {
        type: 's3',
        bucket: 'my-loki-bucket',
        region: 'eu-north-1',
      },
    });

    const result = render(element);
    expect(result.resources).toHaveLength(1);

    const stack = result.resources[0];
    expect(stack.kind).toBe('LokiStack');
    expect(stack.apiVersion).toBe('loki.grafana.com/v1');
    expect((stack as any).spec.storage.type).toBe('s3');
  });
});

describe('AlertingRule', () => {
  it('should render AlertingRule', () => {
    const element = jsx(AlertingRule, {
      name: 'high-error-rate',
      namespace: 'loki',
      groups: [
        {
          name: 'errors',
          rules: [
            {
              alert: 'HighErrorRate',
              expr: 'sum(rate({app="api"} |= "ERROR" [5m])) > 10',
            },
          ],
        },
      ],
    });

    const result = render(element);
    expect(result.resources).toHaveLength(1);
    expect((result.resources[0] as any).spec.groups[0].rules[0].alert).toBe('HighErrorRate');
  });
});
