import { describe, it, expect } from 'vitest';
import { render, jsx, Fragment, declareOperator } from '@r8s/core';
import { cnpgOperator } from '../src/operators';
import { certManagerOperator } from '@r8s/cert-manager';

describe('Operator deduplication', () => {
  it('should deduplicate same operator from two different components', () => {
    // Component A: a database that needs CNPG
    function DatabaseComponent() {
      return [
        declareOperator(cnpgOperator('1.22.5')),
        jsx('Cluster', {
          apiVersion: 'postgresql.cnpg.io/v1',
          kind: 'Cluster',
          metadata: { name: 'db-a', namespace: 'default' },
        }),
      ];
    }

    // Component B: a completely different component that ALSO needs CNPG
    function BackupComponent() {
      return [
        declareOperator(cnpgOperator('1.22.5')),
        jsx('ScheduledBackup', {
          apiVersion: 'postgresql.cnpg.io/v1',
          kind: 'ScheduledBackup',
          metadata: { name: 'backup-b', namespace: 'default' },
        }),
      ];
    }

    const result = render(
      jsx(Fragment, {
        children: [jsx(DatabaseComponent, {}), jsx(BackupComponent, {})],
      })
    );

    // Should have 2 resources but only 1 operator
    expect(result.resources).toHaveLength(2);
    expect(result.operators).toHaveLength(1);
    expect(result.operators[0].name).toBe('cnpg');
    expect(result.operators[0].version).toBe('1.22.5');
  });

  it('should keep different operators from different components', () => {
    // Component A: needs CNPG
    function DatabaseComponent() {
      return [
        declareOperator(cnpgOperator('1.22.5')),
        jsx('Cluster', {
          apiVersion: 'postgresql.cnpg.io/v1',
          kind: 'Cluster',
          metadata: { name: 'db', namespace: 'default' },
        }),
      ];
    }

    // Component B: needs cert-manager (different operator)
    function TLSComponent() {
      return [
        declareOperator(certManagerOperator('1.14.0')),
        jsx('Certificate', {
          apiVersion: 'cert-manager.io/v1',
          kind: 'Certificate',
          metadata: { name: 'tls-cert', namespace: 'default' },
        }),
      ];
    }

    const result = render(
      jsx(Fragment, {
        children: [jsx(DatabaseComponent, {}), jsx(TLSComponent, {})],
      })
    );

    // Should have 2 resources AND 2 different operators
    expect(result.resources).toHaveLength(2);
    expect(result.operators).toHaveLength(2);

    const names = result.operators.map((op) => op.name);
    expect(names).toContain('cnpg');
    expect(names).toContain('cert-manager');
  });
});
