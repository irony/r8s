import { r8sElement } from './jsx-runtime';
import { KubernetesResource } from '@r8s/k8s-types';

export interface ValidationError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Resource or component that caused the error */
  resource?: string;
  /** Field path within the resource */
  field?: string;
  /** Suggested fix */
  suggestion?: string;
}

export class r8sValidationError extends Error {
  errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    const message = errors.map((e) => `[${e.code}] ${e.message}`).join('\n');
    super(message);
    this.name = 'r8sValidationError';
    this.errors = errors;
  }
}

/** Validate a Kubernetes resource */
export function validateResource(resource: KubernetesResource): ValidationError[] {
  const errors: ValidationError[] = [];
  const kind = (resource as any).kind || 'unknown';

  // Check apiVersion
  if (!resource.apiVersion) {
    errors.push({
      code: 'MISSING_API_VERSION',
      message: `Resource "${kind}" is missing apiVersion`,
      resource: kind,
      field: 'apiVersion',
      suggestion: 'Add apiVersion, e.g., "apps/v1" for Deployments',
    });
  }

  // Check kind
  if (!resource.kind) {
    errors.push({
      code: 'MISSING_KIND',
      message: 'Resource is missing kind',
      field: 'kind',
      suggestion: 'Add kind, e.g., "Deployment", "Service", "Ingress"',
    });
  }

  // Check metadata
  if (!resource.metadata) {
    errors.push({
      code: 'MISSING_METADATA',
      message: `Resource "${kind}" is missing metadata`,
      resource: kind,
      field: 'metadata',
      suggestion: 'Add metadata: { name: "my-resource" }',
    });
  } else {
    // Check name
    if (!resource.metadata.name) {
      errors.push({
        code: 'MISSING_NAME',
        message: `Resource "${kind}" is missing metadata.name`,
        resource: kind,
        field: 'metadata.name',
        suggestion: 'Add a name to identify this resource',
      });
    } else if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(resource.metadata.name)) {
      errors.push({
        code: 'INVALID_NAME',
        message: `Resource name "${resource.metadata.name}" is not a valid DNS subdomain name`,
        resource: kind,
        field: 'metadata.name',
        suggestion:
          'Use lowercase letters, numbers, and hyphens only. Must start and end with alphanumeric.',
      });
    }

    // Check namespace
    if (resource.metadata.namespace === '') {
      errors.push({
        code: 'EMPTY_NAMESPACE',
        message: `Resource "${resource.metadata.name}" has an empty namespace`,
        resource: kind,
        field: 'metadata.namespace',
        suggestion: 'Either omit namespace (uses "default") or provide a valid namespace name',
      });
    }
  }

  return errors;
}

/** Validate an Ingress resource specifically */
export function validateIngress(resource: KubernetesResource): ValidationError[] {
  const errors = validateResource(resource);
  const spec = (resource as any).spec;

  if (!spec) {
    errors.push({
      code: 'MISSING_INGRESS_SPEC',
      message: `Ingress "${resource.metadata?.name}" is missing spec`,
      resource: 'Ingress',
      field: 'spec',
      suggestion: 'Add spec with rules defining host and backend service',
    });
    return errors;
  }

  // Check rules
  if (!spec.rules || spec.rules.length === 0) {
    errors.push({
      code: 'MISSING_INGRESS_RULES',
      message: `Ingress "${resource.metadata?.name}" has no rules`,
      resource: 'Ingress',
      field: 'spec.rules',
      suggestion: 'Add at least one rule with host and backend service',
    });
  } else {
    for (let i = 0; i < spec.rules.length; i++) {
      const rule = spec.rules[i];
      if (!rule.host) {
        errors.push({
          code: 'MISSING_INGRESS_HOST',
          message: `Ingress "${resource.metadata?.name}" rule ${i} is missing host`,
          resource: 'Ingress',
          field: `spec.rules[${i}].host`,
          suggestion: 'Add a hostname, e.g., "app.example.com"',
        });
      }
      if (!rule.http || !rule.http.paths || rule.http.paths.length === 0) {
        errors.push({
          code: 'MISSING_INGRESS_PATHS',
          message: `Ingress "${resource.metadata?.name}" rule ${i} has no paths`,
          resource: 'Ingress',
          field: `spec.rules[${i}].http.paths`,
          suggestion: 'Add at least one path with a backend service',
        });
      }
    }
  }

  // Check TLS configuration
  if (spec.tls) {
    for (let i = 0; i < spec.tls.length; i++) {
      const tls = spec.tls[i];
      if (!tls.secretName) {
        errors.push({
          code: 'MISSING_TLS_SECRET',
          message: `Ingress "${resource.metadata?.name}" TLS config ${i} is missing secretName`,
          resource: 'Ingress',
          field: `spec.tls[${i}].secretName`,
          suggestion:
            'Add secretName referencing a TLS certificate secret, or use cert-manager with clusterIssuer annotation',
        });
      }
    }
  }

  return errors;
}

/** Validate a Service resource */
export function validateService(resource: KubernetesResource): ValidationError[] {
  const errors = validateResource(resource);
  const spec = (resource as any).spec;

  if (!spec) {
    errors.push({
      code: 'MISSING_SERVICE_SPEC',
      message: `Service "${resource.metadata?.name}" is missing spec`,
      resource: 'Service',
      field: 'spec',
      suggestion: 'Add spec with ports and selector',
    });
    return errors;
  }

  // Check ports
  if (!spec.ports || spec.ports.length === 0) {
    errors.push({
      code: 'MISSING_SERVICE_PORTS',
      message: `Service "${resource.metadata?.name}" has no ports`,
      resource: 'Service',
      field: 'spec.ports',
      suggestion: 'Add at least one port, e.g., { port: 80, targetPort: 8080 }',
    });
  } else {
    for (let i = 0; i < spec.ports.length; i++) {
      const port = spec.ports[i];
      if (!port.port || port.port < 1 || port.port > 65535) {
        errors.push({
          code: 'INVALID_PORT',
          message: `Service "${resource.metadata?.name}" port ${i} has invalid port number: ${port.port}`,
          resource: 'Service',
          field: `spec.ports[${i}].port`,
          suggestion: 'Port must be between 1 and 65535',
        });
      }
    }
  }

  return errors;
}

/** Validate a Deployment resource */
export function validateDeployment(resource: KubernetesResource): ValidationError[] {
  const errors = validateResource(resource);
  const spec = (resource as any).spec;

  if (!spec) {
    errors.push({
      code: 'MISSING_DEPLOYMENT_SPEC',
      message: `Deployment "${resource.metadata?.name}" is missing spec`,
      resource: 'Deployment',
      field: 'spec',
      suggestion: 'Add spec with replicas, selector, and template',
    });
    return errors;
  }

  // Check replicas
  if (spec.replicas !== undefined && (spec.replicas < 0 || !Number.isInteger(spec.replicas))) {
    errors.push({
      code: 'INVALID_REPLICAS',
      message: `Deployment "${resource.metadata?.name}" has invalid replicas: ${spec.replicas}`,
      resource: 'Deployment',
      field: 'spec.replicas',
      suggestion: 'replicas must be a non-negative integer',
    });
  }

  // Check selector
  if (!spec.selector) {
    errors.push({
      code: 'MISSING_SELECTOR',
      message: `Deployment "${resource.metadata?.name}" is missing spec.selector`,
      resource: 'Deployment',
      field: 'spec.selector',
      suggestion: 'Add selector: { matchLabels: { app: "myapp" } }',
    });
  }

  // Check template
  if (!spec.template) {
    errors.push({
      code: 'MISSING_TEMPLATE',
      message: `Deployment "${resource.metadata?.name}" is missing spec.template`,
      resource: 'Deployment',
      field: 'spec.template',
      suggestion: 'Add template with metadata.labels and spec.containers',
    });
  } else if (
    !spec.template.spec ||
    !spec.template.spec.containers ||
    spec.template.spec.containers.length === 0
  ) {
    errors.push({
      code: 'MISSING_CONTAINERS',
      message: `Deployment "${resource.metadata?.name}" has no containers`,
      resource: 'Deployment',
      field: 'spec.template.spec.containers',
      suggestion: 'Add at least one container with name and image',
    });
  }

  return errors;
}

/** Validate an operator declaration */
export function validateOperator(operator: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!operator.name) {
    errors.push({
      code: 'MISSING_OPERATOR_NAME',
      message: 'Operator is missing name',
      field: 'name',
      suggestion: 'Provide a unique name for the operator, e.g., "cnpg" or "cert-manager"',
    });
  }

  if (!operator.version) {
    errors.push({
      code: 'MISSING_OPERATOR_VERSION',
      message: `Operator "${operator.name || 'unknown'}" is missing version`,
      field: 'version',
      suggestion: 'Provide a semver version, e.g., "1.22.5"',
    });
  } else if (!/^\d+\.\d+\.\d+/.test(operator.version)) {
    errors.push({
      code: 'INVALID_SEMVER',
      message: `Operator "${operator.name}" has invalid version: "${operator.version}"`,
      field: 'version',
      suggestion: 'Use semantic versioning, e.g., "1.22.5" or "1.22.5-rc1"',
    });
  }

  if (!operator.source) {
    errors.push({
      code: 'MISSING_OPERATOR_SOURCE',
      message: `Operator "${operator.name || 'unknown'}" is missing source`,
      field: 'source',
      suggestion: 'Provide source with type (manifest, helm, olm, or flux)',
    });
  }

  return errors;
}

/** Check for duplicate resource names in the same namespace */
export function checkDuplicates(resources: KubernetesResource[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Map<string, number[]>();

  resources.forEach((resource, index) => {
    const key = `${resource.kind || 'unknown'}/${resource.metadata?.namespace || 'default'}/${resource.metadata?.name || 'unnamed'}`;
    if (!seen.has(key)) {
      seen.set(key, []);
    }
    seen.get(key)!.push(index);
  });

  for (const [key, indices] of seen) {
    if (indices.length > 1) {
      const [kind, namespace, name] = key.split('/');
      errors.push({
        code: 'DUPLICATE_RESOURCE',
        message: `Duplicate ${kind} "${name}" in namespace "${namespace}" (found ${indices.length} times)`,
        resource: kind,
        field: 'metadata.name',
        suggestion:
          'Each resource must have a unique name within its namespace and kind. Consider using different names or namespaces.',
      });
    }
  }

  return errors;
}
