import { KubernetesResource } from '@r8s/k8s-types';
import { ValidationError } from './validate';

export interface GuardrailRule {
  /** Unique rule identifier */
  id: string;
  /** Human-readable description */
  description: string;
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
  /** Test function - returns empty array if rule passes, ValidationError[] if it fails */
  test: (resources: KubernetesResource[]) => ValidationError[];
}

/** Check that all namespaces have NetworkPolicies */
export const requireNetworkPolicies: GuardrailRule = {
  id: 'require-network-policies',
  description: 'All namespaces must have at least one NetworkPolicy',
  severity: 'error',
  test: (resources) => {
    const errors: ValidationError[] = [];
    const namespaces = new Set<string>();
    const hasNetworkPolicy = new Set<string>();

    for (const resource of resources as any[]) {
      if (resource.metadata?.namespace) {
        namespaces.add(resource.metadata.namespace);
      }
      if (resource.kind === 'NetworkPolicy' && resource.metadata?.namespace) {
        hasNetworkPolicy.add(resource.metadata.namespace);
      }
    }

    for (const ns of namespaces) {
      if (!hasNetworkPolicy.has(ns)) {
        errors.push({
          code: 'MISSING_NETWORK_POLICY',
          message: `Namespace "${ns}" is missing a NetworkPolicy`,
          resource: 'Namespace',
          field: 'networkPolicy',
          suggestion: `Add a NetworkPolicy for namespace "${ns}" to control ingress/egress traffic`,
        });
      }
    }

    return errors;
  },
};

/** Check that all Deployments have resource limits */
export const requireResourceLimits: GuardrailRule = {
  id: 'require-resource-limits',
  description: 'All containers must have resource requests and limits',
  severity: 'error',
  test: (resources) => {
    const errors: ValidationError[] = [];

    for (const resource of resources as any[]) {
      if (resource.kind === 'Deployment' || resource.kind === 'StatefulSet' || resource.kind === 'DaemonSet') {
        const containers = resource.spec?.template?.spec?.containers || [];
        for (const container of containers) {
          if (!container.resources?.requests) {
            errors.push({
              code: 'MISSING_RESOURCE_REQUESTS',
              message: `Container "${container.name}" in ${resource.kind} "${resource.metadata?.name}" is missing resource requests`,
              resource: resource.kind,
              field: 'spec.template.spec.containers[].resources.requests',
              suggestion: 'Add resource.requests with cpu and memory values',
            });
          }
          if (!container.resources?.limits) {
            errors.push({
              code: 'MISSING_RESOURCE_LIMITS',
              message: `Container "${container.name}" in ${resource.kind} "${resource.metadata?.name}" is missing resource limits`,
              resource: resource.kind,
              field: 'spec.template.spec.containers[].resources.limits',
              suggestion: 'Add resource.limits with cpu and memory values to prevent resource exhaustion',
            });
          }
        }
      }
    }

    return errors;
  },
};

/** Check that all resources have required labels */
export const requireLabels = (requiredLabels: string[]): GuardrailRule => ({
  id: `require-labels-${requiredLabels.sort().join('-')}`,
  description: `All resources must have labels: ${requiredLabels.join(', ')}`,
  severity: 'warning',
  test: (resources) => {
    const errors: ValidationError[] = [];

    for (const resource of resources) {
      const labels = resource.metadata?.labels || {};
      for (const label of requiredLabels) {
        if (!labels[label]) {
          errors.push({
            code: 'MISSING_REQUIRED_LABEL',
            message: `${resource.kind} "${resource.metadata?.name}" is missing required label "${label}"`,
            resource: resource.kind,
            field: `metadata.labels.${label}`,
            suggestion: `Add label "${label}" to ${resource.kind} "${resource.metadata?.name}"`,
          });
        }
      }
    }

    return errors;
  },
});

/** Check that no secrets contain plaintext passwords */
export const noPlaintextSecrets: GuardrailRule = {
  id: 'no-plaintext-secrets',
  description: 'Secrets should not contain plaintext passwords in rendered output',
  severity: 'error',
  test: (resources) => {
    const errors: ValidationError[] = [];

    for (const resource of resources) {
      if (resource.kind === 'Secret') {
        const data = (resource as any).stringData || (resource as any).data || {};
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string' && value.length > 0) {
            // Check if it looks like a password (not a reference)
            if (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret')) {
              errors.push({
                code: 'PLAINTEXT_SECRET',
                message: `Secret "${resource.metadata?.name}" contains plaintext value for key "${key}"`,
                resource: 'Secret',
                field: `stringData.${key}`,
                suggestion: 'Use Vault, Sealed Secrets, or external secret management instead of plaintext',
              });
            }
          }
        }
      }
    }

    return errors;
  },
};

/** Check that Ingresses have TLS configured */
export const requireTLS: GuardrailRule = {
  id: 'require-tls',
  description: 'All Ingress resources must have TLS configured',
  severity: 'warning',
  test: (resources) => {
    const errors: ValidationError[] = [];

    for (const resource of resources) {
      if (resource.kind === 'Ingress') {
        const spec = (resource as any).spec || {};
        if (!spec.tls || spec.tls.length === 0) {
          errors.push({
            code: 'MISSING_TLS',
            message: `Ingress "${resource.metadata?.name}" is missing TLS configuration`,
            resource: 'Ingress',
            field: 'spec.tls',
            suggestion: 'Add TLS configuration with secretName and optionally cert-manager clusterIssuer',
          });
        }
      }
    }

    return errors;
  },
};

/** Check that Pods don't run as root */
export const noRootContainers: GuardrailRule = {
  id: 'no-root-containers',
  description: 'Containers should not run as root user',
  severity: 'error',
  test: (resources) => {
    const errors: ValidationError[] = [];

    for (const resource of resources as any[]) {
      if (resource.kind === 'Deployment' || resource.kind === 'StatefulSet' || resource.kind === 'DaemonSet' || resource.kind === 'Pod') {
        const podSpec = resource.spec?.template?.spec || resource.spec || {};
        const securityContext = podSpec.securityContext || {};
        
        if (securityContext.runAsUser === 0 || securityContext.runAsRoot === true) {
          errors.push({
            code: 'CONTAINER_RUNS_AS_ROOT',
            message: `${resource.kind} "${resource.metadata?.name}" is configured to run as root`,
            resource: resource.kind,
            field: 'spec.template.spec.securityContext.runAsUser',
            suggestion: 'Set runAsUser to a non-zero UID and runAsRoot to false',
          });
        }

        for (const container of podSpec.containers || []) {
          const containerSecurity = container.securityContext || {};
          if (containerSecurity.runAsUser === 0 || containerSecurity.runAsRoot === true) {
            errors.push({
              code: 'CONTAINER_RUNS_AS_ROOT',
              message: `Container "${container.name}" in ${resource.kind} "${resource.metadata?.name}" runs as root`,
              resource: resource.kind,
              field: 'spec.template.spec.containers[].securityContext.runAsUser',
              suggestion: 'Set securityContext.runAsUser to a non-zero UID',
            });
          }
        }
      }
    }

    return errors;
  },
};

/** Default set of guardrails for production use */
export const defaultGuardrails: GuardrailRule[] = [
  requireNetworkPolicies,
  requireResourceLimits,
  noPlaintextSecrets,
  requireTLS,
  noRootContainers,
];

/** Run all guardrail rules against a set of resources */
export function runGuardrails(
  resources: KubernetesResource[],
  rules: GuardrailRule[] = defaultGuardrails
): { passed: boolean; errors: ValidationError[]; warnings: ValidationError[]; info: ValidationError[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const info: ValidationError[] = [];

  for (const rule of rules) {
    const ruleErrors = rule.test(resources);
    for (const error of ruleErrors) {
      if (rule.severity === 'error') {
        errors.push(error);
      } else if (rule.severity === 'warning') {
        warnings.push(error);
      } else if (rule.severity === 'info') {
        info.push(error);
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    info,
  };
}
