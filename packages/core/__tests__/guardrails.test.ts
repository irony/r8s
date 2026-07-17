import { describe, it, expect } from 'vitest';
import {
  runGuardrails,
  defaultGuardrails,
  requireNetworkPolicies,
  requireResourceLimits,
  requireLabels,
  noPlaintextSecrets,
  requireTLS,
  noRootContainers,
} from '../src/guardrails';

describe('Guardrails', () => {
  describe('requireNetworkPolicies', () => {
    it('should pass when all namespaces have NetworkPolicies', () => {
      const resources = [
        {
          apiVersion: 'v1',
          kind: 'Deployment',
          metadata: { name: 'app', namespace: 'production' },
        },
        {
          apiVersion: 'networking.k8s.io/v1',
          kind: 'NetworkPolicy',
          metadata: { name: 'default', namespace: 'production' },
        },
      ];

      const result = runGuardrails(resources, [requireNetworkPolicies]);
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.info).toHaveLength(0);
    });

    it('should fail when a namespace is missing NetworkPolicy', () => {
      const resources = [
        {
          apiVersion: 'v1',
          kind: 'Deployment',
          metadata: { name: 'app', namespace: 'production' },
        },
      ];

      const result = runGuardrails(resources, [requireNetworkPolicies]);
      expect(result.passed).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_NETWORK_POLICY');
    });
  });

  describe('requireResourceLimits', () => {
    it('should pass when containers have resource limits', () => {
      const resources = [
        {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: { name: 'app' },
          spec: {
            template: {
              spec: {
                containers: [
                  {
                    name: 'app',
                    resources: {
                      requests: { cpu: '100m', memory: '128Mi' },
                      limits: { cpu: '500m', memory: '512Mi' },
                    },
                  },
                ],
              },
            },
          },
        },
      ];

      const result = runGuardrails(resources, [requireResourceLimits]);
      expect(result.passed).toBe(true);
    });

    it('should fail when containers are missing resource limits', () => {
      const resources = [
        {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: { name: 'app' },
          spec: {
            template: {
              spec: {
                containers: [{ name: 'app' }],
              },
            },
          },
        },
      ];

      const result = runGuardrails(resources, [requireResourceLimits]);
      expect(result.passed).toBe(false);
      expect(result.errors).toHaveLength(2); // missing requests + limits
    });
  });

  describe('requireLabels', () => {
    it('should pass when all required labels are present', () => {
      const resources = [
        {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: { name: 'app', labels: { app: 'myapp', team: 'platform' } },
        },
      ];

      const result = runGuardrails(resources, [requireLabels(['app', 'team'])]);
      expect(result.passed).toBe(true);
    });

    it('should warn when labels are missing', () => {
      const resources = [
        {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: { name: 'app', labels: { app: 'myapp' } },
        },
      ];

      const result = runGuardrails(resources, [requireLabels(['app', 'team'])]);
      expect(result.passed).toBe(true); // warnings don't fail
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('MISSING_REQUIRED_LABEL');
    });
  });

  describe('noPlaintextSecrets', () => {
    it('should pass when secrets use external references', () => {
      const resources = [
        {
          apiVersion: 'v1',
          kind: 'Secret',
          metadata: { name: 'app-secrets' },
          stringData: {
            config: 'some-config-value',
          },
        },
      ];

      const result = runGuardrails(resources, [noPlaintextSecrets]);
      expect(result.passed).toBe(true);
    });

    it('should fail when secrets contain plaintext passwords', () => {
      const resources = [
        {
          apiVersion: 'v1',
          kind: 'Secret',
          metadata: { name: 'app-secrets' },
          stringData: {
            password: 'supersecret123',
          },
        },
      ];

      const result = runGuardrails(resources, [noPlaintextSecrets]);
      expect(result.passed).toBe(false);
      expect(result.errors[0].code).toBe('PLAINTEXT_SECRET');
    });
  });

  describe('requireTLS', () => {
    it('should pass when Ingress has TLS', () => {
      const resources = [
        {
          apiVersion: 'networking.k8s.io/v1',
          kind: 'Ingress',
          metadata: { name: 'app' },
          spec: {
            tls: [{ secretName: 'app-tls' }],
          },
        },
      ];

      const result = runGuardrails(resources, [requireTLS]);
      expect(result.passed).toBe(true);
    });

    it('should warn when Ingress is missing TLS', () => {
      const resources = [
        {
          apiVersion: 'networking.k8s.io/v1',
          kind: 'Ingress',
          metadata: { name: 'app' },
          spec: {},
        },
      ];

      const result = runGuardrails(resources, [requireTLS]);
      expect(result.passed).toBe(true); // warning, not error
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('noRootContainers', () => {
    it('should pass when containers run as non-root', () => {
      const resources = [
        {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: { name: 'app' },
          spec: {
            template: {
              spec: {
                securityContext: { runAsUser: 1000, runAsRoot: false },
                containers: [{ name: 'app' }],
              },
            },
          },
        },
      ];

      const result = runGuardrails(resources, [noRootContainers]);
      expect(result.passed).toBe(true);
    });

    it('should fail when containers run as root', () => {
      const resources = [
        {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: { name: 'app' },
          spec: {
            template: {
              spec: {
                securityContext: { runAsUser: 0 },
                containers: [{ name: 'app' }],
              },
            },
          },
        },
      ];

      const result = runGuardrails(resources, [noRootContainers]);
      expect(result.passed).toBe(false);
      expect(result.errors[0].code).toBe('CONTAINER_RUNS_AS_ROOT');
    });
  });

  describe('defaultGuardrails', () => {
    it('should run all default rules', () => {
      const resources = [
        {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: { name: 'app', namespace: 'default' },
          spec: {
            template: {
              spec: {
                containers: [
                  {
                    name: 'app',
                    resources: {
                      requests: { cpu: '100m' },
                      limits: { cpu: '500m' },
                    },
                  },
                ],
              },
            },
          },
        },
      ];

      const result = runGuardrails(resources);
      // Should have errors for missing NetworkPolicy, missing memory limits, etc.
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
