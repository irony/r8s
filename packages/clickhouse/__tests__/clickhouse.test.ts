import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import { jsx } from '@r8s/core';
import { ClickHouseCluster, clickhouseOperator } from '../src/index';

describe('ClickHouse Operator', () => {
  it('should declare clickhouse-operator', () => {
    const op = clickhouseOperator('0.23.0');
    expect(op.name).toBe('clickhouse-operator');
    expect(op.source.type).toBe('helm');
    expect(op.source.chart).toBe('clickhouse-operator-helm');
  });
});

describe('ClickHouseCluster', () => {
  it('should render ClickHouseInstallation', () => {
    const element = jsx(ClickHouseCluster, {
      name: 'analytics',
      namespace: 'production',
      cluster: {
        layout: {
          shardsCount: 2,
          replicasCount: 2,
        },
      },
    });

    const result = render(element);
    expect(result.resources).toHaveLength(1);

    const chi = result.resources[0];
    expect(chi.kind).toBe('ClickHouseInstallation');
    expect(chi.apiVersion).toBe('clickhouse.altinity.com/v1');
    expect(chi.metadata.name).toBe('analytics');
    expect((chi as any).spec.configuration.clusters[0].layout.shardsCount).toBe(2);
    expect((chi as any).spec.configuration.clusters[0].layout.replicasCount).toBe(2);
  });
});
