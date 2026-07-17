/**
 * Base operator types for r8s.
 *
 * These types define the contract for operator declarations.
 * Each package is responsible for defining its own operators
 * using these base types.
 *
 * @example
 * ```ts
 * // In @r8s/cert-manager package:
 * import { manifestOperator } from '@r8s/k8s-types';
 *
 * export const certManagerOperator = (version = '1.14.0') =>
 *   manifestOperator('cert-manager', `https://.../cert-manager-${version}.yaml`, version, {
 *     description: 'cert-manager for TLS',
 *     crds: ['certificates.cert-manager.io'],
 *   });
 * ```
 */

/** Supported operator installation methods */
export type OperatorSource =
  | { type: 'manifest'; url: string; version: string; namespace?: string }
  | {
      type: 'helm';
      chart: string;
      repository: string;
      version: string;
      namespace?: string;
      values?: Record<string, unknown>;
    }
  | { type: 'olm'; package: string; channel: string; version?: string }
  | {
      type: 'flux';
      sourceRef: { kind: string; name: string; namespace: string };
      chart: string;
      version: string;
    };

/** Operator dependency declaration */
export interface Operator {
  /** Unique operator identifier (e.g., 'cnpg', 'cert-manager') */
  name: string;
  /** Human-readable description */
  description?: string;
  /** How to install this operator */
  source: OperatorSource;
  /** Minimum required version (semver) */
  version: string;
  /** Namespaces this operator should watch (empty = cluster-wide) */
  watchNamespaces?: string[];
  /** Other operators this one depends on */
  dependencies?: string[];
  /** Custom resource definitions provided by this operator */
  crds?: string[];
  /** Installation command for direct use */
  installCommand?: string;
}

/** Helper to create a manifest-based operator declaration */
export function manifestOperator(
  name: string,
  url: string,
  version: string,
  options?: {
    description?: string;
    namespace?: string;
    watchNamespaces?: string[];
    dependencies?: string[];
    crds?: string[];
  }
): Operator {
  return {
    name,
    description: options?.description,
    source: {
      type: 'manifest',
      url,
      version,
      namespace: options?.namespace,
    },
    version,
    watchNamespaces: options?.watchNamespaces,
    dependencies: options?.dependencies,
    crds: options?.crds,
    installCommand: `kubectl apply --server-side -f ${url}`,
  };
}

/** Helper to create a Helm-based operator declaration */
export function helmOperator(
  name: string,
  chart: string,
  repository: string,
  version: string,
  options?: {
    description?: string;
    namespace?: string;
    values?: Record<string, unknown>;
    watchNamespaces?: string[];
    dependencies?: string[];
    crds?: string[];
  }
): Operator {
  return {
    name,
    description: options?.description,
    source: {
      type: 'helm',
      chart,
      repository,
      version,
      namespace: options?.namespace,
      values: options?.values,
    },
    version,
    watchNamespaces: options?.watchNamespaces,
    dependencies: options?.dependencies,
    crds: options?.crds,
    installCommand: `helm upgrade --install ${name} ${chart} --repo ${repository} --namespace ${options?.namespace || name + '-system'} --create-namespace`,
  };
}

/** Helper to create an OLM-based operator declaration */
export function olmOperator(
  name: string,
  packageName: string,
  channel: string,
  version: string,
  options?: {
    description?: string;
    watchNamespaces?: string[];
    dependencies?: string[];
    crds?: string[];
  }
): Operator {
  return {
    name,
    description: options?.description,
    source: {
      type: 'olm',
      package: packageName,
      channel,
      version,
    },
    version,
    watchNamespaces: options?.watchNamespaces,
    dependencies: options?.dependencies,
    crds: options?.crds,
    installCommand: `kubectl apply -f https://operatorhub.io/install/${packageName}.yaml`,
  };
}
