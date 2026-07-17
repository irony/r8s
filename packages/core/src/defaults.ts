import { createContext } from './context';
import type { Operator } from '@r8s/k8s-types';

/** Database connection info passed via context */
export interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  username: string;
  passwordSecret: { name: string; key: string };
  /** Key for the password within the secret (defaults to 'password') */
  passwordKey?: string;
  vendor?: string;
}

/** Secret provider configuration */
export interface SecretProvider {
  backend: 'vault' | 'openbao' | 'kubernetes';
  mount?: string;
  path?: string;
  authRef?: string;
}

/**
 * Default contexts for shared infrastructure properties.
 *
 * These contexts allow properties to be inherited down the component tree,
 * eliminating the need to pass the same values to every component.
 *
 * @example
 * ```tsx
 * import { Namespace, Labels } from '@r8s/core/defaults';
 *
 * export default function App() {
 *   return (
 *     <Namespace.Provider value="production">
 *       <Labels.Provider value={{ app: 'myapp', team: 'platform' }}>
 *         <Database name="app-db" />
 *         <WebService name="api" image="myapp/api:v1" />
 *       </Labels.Provider>
 *     </Namespace.Provider>
 *   );
 * }
 * ```
 */

/** Inherits namespace to all child resources */
export const Namespace = createContext<string>('default');

/** Inherits labels to all child resources */
export const Labels = createContext<Record<string, string>>({});

/** Inherits annotations to all child resources */
export const Annotations = createContext<Record<string, string>>({});

/** Inherits environment variables to all child containers */
export const Environment = createContext<Array<{ name: string; value: string }>>([]);

/** Inherits resource requests/limits to all child containers */
export const Resources = createContext<{
  requests?: Record<string, string>;
  limits?: Record<string, string>;
}>({});

/** Inherits service account name to all child pods */
export const ServiceAccount = createContext<string>('default');

/** Inherits image registry prefix (e.g., 'ghcr.io/myorg') */
export const ImageRegistry = createContext<string>('');

/** Inherits domain suffix for ingresses */
export const Domain = createContext<string>('');

/** Inherits TLS configuration */
export const TLS = createContext<{
  enabled: boolean;
  issuer?: string;
  secretName?: string;
}>({ enabled: false });

/**
 * Cluster context for shared PostgreSQL clusters.
 *
 * When multiple databases should share the same CNPG cluster,
 * wrap them in a Cluster component. Each Database reads this
 * context and creates a database within the cluster instead of
 * creating its own cluster.
 *
 * @example
 * ```tsx
 * import { Cluster } from '@r8s/recipes';
 *
 * <Cluster name="main" storage="100Gi">
 *   <Database name="user-db" />
 *   <Database name="order-db" />
 * </Cluster>
 * ```
 */
export interface ClusterConfig {
  name: string;
  namespace: string;
  storage: string;
  host: string;
  secretName: string;
}

export const ClusterContext = createContext<ClusterConfig | null>(null);

/**
 * Database connection context for component composition.
 *
 * When a Database component renders, it sets this context so that
 * downstream components can automatically wire up their connections.
 *
 * @example
 * ```tsx
 * import { DatabaseContext } from '@r8s/core/defaults';
 *
 * export default function Platform() {
 *   return (
 *     <Database name="keycloak-db" storage="10Gi">
 *       <KeycloakInstance name="keycloak" hostname="auth.example.com" />
 *     </Database>
 *   );
 * }
 * ```
 */
export const DatabaseContext = createContext<DatabaseConnection | null>(null);

/**
 * Secret provider context for pluggable secret management.
 *
 * Components read this to determine how credentials should be stored:
 * - Vault: Creates VaultStaticSecret + VaultAuth (VSO)
 * - OpenBao: Creates OpenBaoStaticSecret + OpenBaoAuth
 * - Kubernetes: Plain Kubernetes Secret
 *
 * @example
 * ```tsx
 * import { SecretContext } from '@r8s/core/defaults';
 *
 * // Use Vault for all secrets in this subtree
 * <SecretContext.Provider value={{ backend: 'vault', mount: 'secret', path: 'app/db', authRef: 'vault-auth' }}>
 *   <Database name="app-db" storage="10Gi" />
 *   <KeycloakInstance name="keycloak" hostname="auth.example.com" />
 * </SecretContext.Provider>
 * ```
 */
export const SecretContext = createContext<SecretProvider | null>(null);

/**
 * Operator context for declaring Kubernetes operator dependencies.
 *
 * Components that require operators (CNPG, cert-manager, etc.) can either:
 * 1. Read operators from this context (shared operators)
 * 2. Create their own operator instances and return them as resources
 *
 * The renderer collects all operators so the deployment pipeline can
 * install them before applying application resources.
 *
 * @example
 * ```tsx
 * import { OperatorContext } from '@r8s/core/defaults';
 * import { cnpgOperator } from '@r8s/recipes';
 * import { certManagerOperator } from '@r8s/cert-manager';
 *
 * // Shared operators for entire stack
 * <OperatorContext.Provider value={[
 *   cnpgOperator('1.22.5'),
 *   certManagerOperator('1.14.0'),
 * ]}>
 *   <Database name="app-db" storage="10Gi" />
 *   <App name="myapp" domain="myapp.example.com" tls />
 * </OperatorContext.Provider>
 * ```
 */
export const OperatorContext = createContext<Operator[]>([]);
