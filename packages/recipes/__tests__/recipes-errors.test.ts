import { describe, it, expect } from 'vitest';
import { render, jsx, Fragment } from '@r8s/core';
import { validateResource } from '@r8s/core';
import { Database, App, WebService, Ingress, Cluster } from '../src/index';
import { OperatorContext } from '@r8s/core/defaults';
import { cnpgOperator, nginxIngressOperator } from '../src/operators';

describe('Recipes Error Cases', () => {
  describe('Database', () => {
    it('should handle missing storage gracefully', () => {
      const element = jsx(Database, { name: 'test-db' });
      const result = render(element);

      expect(result.resources).toHaveLength(1);
      expect(result.resources[0].kind).toBe('Cluster');
    });

    it('should handle empty name', () => {
      const element = jsx(Database, { name: '' });
      const result = render(element);

      // Empty name should be caught by validation
      const validationErrors = validateResource(result.resources[0]);
      expect(validationErrors.some(e => e.code === 'MISSING_NAME')).toBe(true);
    });

    it('should not duplicate CNPG operator when provided via context', () => {
      const element = jsx(OperatorContext.Provider, {
        value: [cnpgOperator('1.22.5')],
        children: jsx(Database, { name: 'test-db' }),
      });

      const result = render(element);
      expect(result.operators).toHaveLength(1);
      expect(result.operators[0].name).toBe('cnpg');
    });

    it('should handle special characters in database name', () => {
      const element = jsx(Database, { name: 'test-db_123' });
      const result = render(element);

      // Names with underscores are invalid in Kubernetes
      const validationErrors = validateResource(result.resources[0]);
      expect(validationErrors.some(e => e.code === 'INVALID_NAME')).toBe(true);
    });
  });

  describe('App', () => {
    it('should handle missing optional props', () => {
      const element = jsx(App, {
        name: 'test-app',
        image: 'test:latest',
        host: 'test.example.com',
      });
      const result = render(element);

      expect(result.resources).toHaveLength(3); // Deployment, Service, Ingress
    });

    it('should handle empty env', () => {
      const element = jsx(App, {
        name: 'test-app',
        image: 'test:latest',
        host: 'test.example.com',
        env: {},
      });
      const result = render(element);

      const deployment = result.resources.find(r => r.kind === 'Deployment');
      expect(deployment).toBeDefined();
    });

    it('should handle zero replicas', () => {
      const element = jsx(App, {
        name: 'test-app',
        image: 'test:latest',
        host: 'test.example.com',
        replicas: 0,
      });
      const result = render(element);

      const deployment = result.resources.find(r => r.kind === 'Deployment');
      expect((deployment as any).spec.replicas).toBe(0);
    });
  });

  describe('WebService', () => {
    it('should handle missing env', () => {
      const element = jsx(WebService, {
        name: 'test-service',
        image: 'test:latest',
      });
      const result = render(element);

      expect(result.resources).toHaveLength(2); // Deployment, Service
    });

    it('should handle empty secrets', () => {
      const element = jsx(WebService, {
        name: 'test-service',
        image: 'test:latest',
        secrets: {},
      });
      const result = render(element);

      const deployment = result.resources.find(r => r.kind === 'Deployment');
      expect((deployment as any).spec.template.spec.containers[0].env).toEqual([]);
    });
  });

  describe('Ingress', () => {
    it('should handle TLS configuration', () => {
      const element = jsx(Ingress, {
        name: 'test-ingress',
        host: 'test.example.com',
        serviceName: 'test-service',
        servicePort: 80,
        tls: { secretName: 'test-tls', clusterIssuer: 'letsencrypt' },
      });
      const result = render(element);

      expect(result.operators).toHaveLength(2); // nginx-ingress + cert-manager
    });

    it('should handle missing TLS gracefully', () => {
      const element = jsx(Ingress, {
        name: 'test-ingress',
        host: 'test.example.com',
        serviceName: 'test-service',
        servicePort: 80,
      });
      const result = render(element);

      expect(result.resources).toHaveLength(1);
      expect(result.operators).toHaveLength(1); // nginx-ingress only
    });
  });

  describe('Cluster', () => {
    it('should handle missing storage with default', () => {
      const element = jsx(Cluster, { name: 'main' });
      const result = render(element);

      expect(result.resources).toHaveLength(1);
      expect((result.resources[0] as any).spec.storage.size).toBe('50Gi');
    });

    it('should handle children databases', () => {
      const element = jsx(Cluster, {
        name: 'main',
        children: jsx(Fragment, {
          children: [
            jsx(Database, { name: 'db1' }),
            jsx(Database, { name: 'db2' }),
          ],
        }),
      });
      const result = render(element);

      expect(result.resources.length).toBeGreaterThan(1);
    });
  });

  describe('Integration', () => {
    it('should handle complex composition', () => {
      const element = jsx(OperatorContext.Provider, {
        value: [cnpgOperator('1.22.5'), nginxIngressOperator('1.15.1')],
        children: jsx(Fragment, {
          children: [
            jsx(Database, { name: 'app-db', storage: '10Gi' }),
            jsx(App, {
              name: 'api',
              image: 'myapp/api:v1',
              host: 'api.example.com',
              env: { LOG_LEVEL: 'info' },
            }),
          ],
        }),
      });

      const result = render(element);
      expect(result.resources.length).toBeGreaterThan(0);
      expect(result.operators).toHaveLength(2);
    });

    it('should handle nested contexts', () => {
      const element = jsx(OperatorContext.Provider, {
        value: [cnpgOperator('1.22.5')],
        children: jsx(Cluster, {
          name: 'main',
          children: jsx(Database, { name: 'app-db' }),
        }),
      });

      const result = render(element);
      expect(result.operators).toHaveLength(1);
    });
  });
});
