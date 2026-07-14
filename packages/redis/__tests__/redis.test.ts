import { describe, it, expect } from 'vitest';
import { render } from '@r8s/core';
import { jsx } from '@r8s/core';
import { RedisCluster, RedisReplication, redisOperator } from '../src/index';

describe('Redis Operator', () => {
  it('should declare redis-operator', () => {
    const op = redisOperator('0.22.0');
    expect(op.name).toBe('redis-operator');
    expect(op.source.type).toBe('helm');
    expect(op.source.chart).toBe('redis-operator');
    expect(op.source.repository).toBe('https://ot-container-kit.github.io/helm-charts/');
  });
});

describe('RedisCluster', () => {
  it('should render RedisCluster with defaults', () => {
    const element = jsx(RedisCluster, {
      name: 'cache',
      namespace: 'production',
    });

    const result = render(element);
    expect(result.resources).toHaveLength(1);

    const cluster = result.resources[0];
    expect(cluster.kind).toBe('RedisCluster');
    expect(cluster.apiVersion).toBe('redis.redis.opstreelabs.in/v1beta1');
    expect(cluster.metadata.name).toBe('cache');
    expect(cluster.metadata.namespace).toBe('production');
    expect((cluster as any).spec.clusterSize).toBe(3);
    expect((cluster as any).spec.redisExporter.enabled).toBe(true);
  });

  it('should render RedisCluster with storage', () => {
    const element = jsx(RedisCluster, {
      name: 'persistent-cache',
      namespace: 'production',
      clusterSize: 5,
      storage: '50Gi',
      storageClassName: 'fast-ssd',
    });

    const result = render(element);
    const cluster = result.resources[0] as any;
    expect(cluster.spec.clusterSize).toBe(5);
    expect(cluster.spec.storage.volumeClaimTemplate.spec.resources.requests.storage).toBe('50Gi');
    expect(cluster.spec.storage.volumeClaimTemplate.spec.storageClassName).toBe('fast-ssd');
  });
});

describe('RedisReplication', () => {
  it('should render RedisReplication', () => {
    const element = jsx(RedisReplication, {
      name: 'redis-master',
      namespace: 'default',
      clusterSize: 2,
    });

    const result = render(element);
    expect(result.resources).toHaveLength(1);

    const repl = result.resources[0];
    expect(repl.kind).toBe('RedisReplication');
    expect((repl as any).spec.clusterSize).toBe(2);
  });
});
