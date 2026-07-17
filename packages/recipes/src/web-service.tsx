import { jsx, declareOperator, useContext } from '@r8s/core';
import { Deployment, Service, EnvVar } from '@r8s/k8s-types';
import { OperatorContext } from '@r8s/core/defaults';
import { vaultSecretsOperator } from './operators';

export interface SecretRef {
  /** Name of the Kubernetes Secret containing this value */
  secret: string;
  /** Key within the secret (defaults to env var name) */
  key?: string;
}

export interface VaultSecretRef {
  /** Vault KV mount path */
  mount: string;
  /** Secret path in Vault */
  path: string;
  /** Key within the Vault secret (defaults to env var name) */
  key?: string;
  /** VaultAuth reference name (defaults to 'default') */
  vaultAuthRef?: string;
}

export interface WebServiceProps {
  name: string;
  namespace?: string;
  image: string;
  port?: number;
  replicas?: number;
  /** Plain environment variables (non-sensitive) */
  env?: Record<string, string>;
  /** Secrets from Kubernetes Secrets — safe by default */
  secrets?: Record<string, SecretRef | string>;
  /** Secrets from Vault — creates VaultStaticSecret objects */
  vault?: Record<string, VaultSecretRef>;
  /** Raw env vars for advanced use cases */
  rawEnv?: EnvVar[];
  resources?: {
    requests?: { cpu?: string; memory?: string };
    limits?: { cpu?: string; memory?: string };
  };
}

/**
 * Simple web service (backend or frontend).
 *
 * Creates a Deployment + Service with health checks.
 *
 * @example
 * // Plain env vars
 * <WebService name="api" image="myapp/api:v1" port={3000} env={{ LOG_LEVEL: 'info' }} />
 *
 * // With secrets from Kubernetes Secrets
 * <WebService
 *   name="api"
 *   image="myapp/api:v1"
 *   env={{ LOG_LEVEL: 'info' }}
 *   secrets={{ DATABASE_URL: 'app-secrets', API_KEY: 'app-secrets' }}
 * />
 *
 * // With Vault secrets (creates VaultStaticSecret objects)
 * <WebService
 *   name="api"
 *   image="myapp/api:v1"
 *   env={{ LOG_LEVEL: 'info' }}
 *   vault={{ DATABASE_URL: { mount: 'kv', path: 'db/credentials' } }}
 * />
 */
export function WebService(props: WebServiceProps) {
  const {
    name,
    namespace = 'default',
    image,
    port = 3000,
    replicas = 2,
    env = {},
    secrets = {},
    vault = {},
    rawEnv = [],
    resources,
  } = props;

  const envVars: EnvVar[] = [];
  const envFrom: Array<{ secretRef: { name: string } }> = [];
  const vaultResources: ReturnType<typeof jsx>[] = [];

  // Plain env vars
  for (const [key, value] of Object.entries(env)) {
    envVars.push({ name: key, value });
  }

  // Secrets from Kubernetes Secrets
  for (const [envName, ref] of Object.entries(secrets)) {
    if (typeof ref === 'string') {
      // Simple string: secret name, key = env name
      envVars.push({
        name: envName,
        valueFrom: { secretKeyRef: { name: ref, key: envName } },
      });
    } else {
      // Object with explicit secret/key
      envVars.push({
        name: envName,
        valueFrom: { secretKeyRef: { name: ref.secret, key: ref.key || envName } },
      });
    }
  }

  // Vault secrets — create VaultStaticSecret objects
  for (const [envName, ref] of Object.entries(vault)) {
    const secretName = `${name}-${envName.toLowerCase().replace(/_/g, '-')}-vault`;
    
    // Create VaultStaticSecret
    vaultResources.push(
      jsx('VaultStaticSecret', {
        apiVersion: 'secrets.hashicorp.com/v1beta1',
        kind: 'VaultStaticSecret',
        metadata: { name: secretName, namespace },
        spec: {
          vaultAuthRef: ref.vaultAuthRef || 'default',
          mount: ref.mount,
          type: 'kv-v2',
          path: ref.path,
          destination: {
            create: true,
            name: secretName,
          },
        },
      })
    );

    // Reference the generated secret
    envVars.push({
      name: envName,
      valueFrom: { secretKeyRef: { name: secretName, key: ref.key || envName } },
    });
  }

  // Raw env vars (advanced)
  envVars.push(...rawEnv);

  // Declare Vault Secrets Operator if vault secrets are used
  if (Object.keys(vault).length > 0) {
    const sharedOperators = useContext(OperatorContext);
    const hasVSO = sharedOperators.some(op => op.name === 'vault-secrets-operator');
    if (!hasVSO) {
      vaultResources.push(declareOperator(vaultSecretsOperator()));
    }
  }

  const deployment: Deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: { name, namespace, labels: { app: name } },
    spec: {
      replicas,
      selector: { matchLabels: { app: name } },
      template: {
        metadata: { labels: { app: name } },
        spec: {
          containers: [{
            name: 'app',
            image,
            ports: [{ containerPort: port }],
            env: envVars,
            ...(envFrom.length > 0 && { envFrom }),
            ...(resources && { resources }),
            livenessProbe: {
              httpGet: { path: '/health', port },
              initialDelaySeconds: 10,
              periodSeconds: 10,
            },
            readinessProbe: {
              httpGet: { path: '/ready', port },
              initialDelaySeconds: 5,
              periodSeconds: 5,
            },
          }],
        },
      },
    },
  };

  const service: Service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: { name, namespace },
    spec: {
      type: 'ClusterIP',
      selector: { app: name },
      ports: [{ port: 80, targetPort: port }],
    },
  };

  return [
    ...vaultResources,
    jsx('Deployment', deployment),
    jsx('Service', service),
  ];
}
