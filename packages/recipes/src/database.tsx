import { jsx, useContext, declareOperator } from '@r8s/core';
import { Cluster } from '@r8s/k8s-types';
import { DatabaseContext, SecretContext, OperatorContext, ClusterContext } from '@r8s/core/defaults';
import { cnpgOperator } from './operators';

export interface DatabaseProps {
  name: string;
  namespace?: string;
  storage?: string;
  /** Operator version override. If not set, reads from OperatorContext or uses default. */
  operatorVersion?: string;
  children?: unknown;
}

/**
 * CloudNativePG PostgreSQL database.
 *
 * By default, creates a dedicated 3-instance HA cluster for this database.
 * When wrapped in a `<Cluster>` component, creates a database within
 * the shared cluster instead.
 *
 * @example
 * // Dedicated cluster (default)
 * <Database name="app-db" storage="10Gi" />
 *
 * @example
 * // Shared cluster
 * <Cluster name="main" storage="100Gi">
 *   <Database name="user-db" />
 *   <Database name="order-db" />
 * </Cluster>
 *
 * @example
 * // With child components that auto-connect
 * <Database name="keycloak-db" storage="10Gi">
 *   <KeycloakInstance name="keycloak" hostname="auth.example.com" />
 * </Database>
 */
export function Database(props: DatabaseProps) {
  const {
    name,
    namespace = 'default',
    storage = '10Gi',
    operatorVersion,
    children,
  } = props;

  const clusterConfig = useContext(ClusterContext);
  const secretProvider = useContext(SecretContext);
  const sharedOperators = useContext(OperatorContext);
  const secretName = `${name}-db-credentials`;

  const resources: ReturnType<typeof jsx>[] = [];

  if (clusterConfig) {
    // Running inside a shared cluster - create database only
    const connection = {
      host: clusterConfig.host,
      port: 5432,
      database: name,
      username: name,
      passwordSecret: { name: secretName, key: 'password' },
      passwordKey: 'password',
      vendor: 'postgres' as const,
    };

    // Create secret for this database (respect SecretContext)
    if (secretProvider) {
      switch (secretProvider.backend) {
        case 'vault':
          resources.push(
            jsx('VaultStaticSecret', {
              apiVersion: 'secrets.hashicorp.com/v1beta1',
              kind: 'VaultStaticSecret',
              metadata: { name: `${name}-db-secret`, namespace },
              spec: {
                vaultAuthRef: secretProvider.authRef,
                mount: secretProvider.mount,
                type: 'kv-v2',
                path: `${secretProvider.path}/${name}`,
                destination: {
                  create: true,
                  name: secretName,
                },
              },
            })
          );
          break;

        case 'openbao':
          resources.push(
            jsx('OpenBaoStaticSecret', {
              apiVersion: 'secrets.openbao.org/v1beta1',
              kind: 'OpenBaoStaticSecret',
              metadata: { name: `${name}-db-secret`, namespace },
              spec: {
                openbaoAuthRef: secretProvider.authRef,
                mount: secretProvider.mount,
                type: 'kv-v2',
                path: `${secretProvider.path}/${name}`,
                destination: {
                  create: true,
                  name: secretName,
                },
              },
            })
          );
          break;

        case 'kubernetes':
          // Fall through to plain Secret
        default:
          resources.push(
            jsx('Secret', {
              apiVersion: 'v1',
              kind: 'Secret',
              metadata: { name: secretName, namespace },
              stringData: {
                password: `${name}-password`,
                username: name,
                uri: `postgresql://${name}:${name}-password@${clusterConfig.host}:5432/${name}`,
              },
            })
          );
      }
    } else {
      // No SecretContext - create plain Secret
      resources.push(
        jsx('Secret', {
          apiVersion: 'v1',
          kind: 'Secret',
          metadata: { name: secretName, namespace },
          stringData: {
            password: `${name}-password`,
            username: name,
            uri: `postgresql://${name}:${name}-password@${clusterConfig.host}:5432/${name}`,
          },
        })
      );
    }

    if (children) {
      resources.push(
        jsx(DatabaseContext.Provider, {
          value: connection,
          children,
        })
      );
    }
  } else {
    // Dedicated cluster - create full CNPG cluster
    const hasCNPG = sharedOperators.some(op => op.name === 'cnpg');

    const cluster: Cluster = {
      apiVersion: 'postgresql.cnpg.io/v1',
      kind: 'Cluster',
      metadata: { name, namespace },
      spec: {
        instances: 3,
        storage: {
          size: storage,
        },
        bootstrap: {
          initdb: {
            database: name,
            owner: name,
            secret: {
              name: secretName,
            },
          },
        },
        monitoring: {
          enabled: true,
        },
      },
    };

    const connection = {
      host: `${name}-rw`,
      port: 5432,
      database: name,
      username: name,
      passwordSecret: { name: secretName, key: 'password' },
      passwordKey: 'password',
      vendor: 'postgres' as const,
    };

    // Declare CNPG operator if not already provided via context
    if (!hasCNPG) {
      resources.push(
        declareOperator(cnpgOperator(operatorVersion))
      );
    }

    resources.push(jsx('Cluster', cluster));

    // Create secret resources based on SecretContext
    if (secretProvider) {
      switch (secretProvider.backend) {
        case 'vault':
          resources.push(
            jsx('VaultStaticSecret', {
              apiVersion: 'secrets.hashicorp.com/v1beta1',
              kind: 'VaultStaticSecret',
              metadata: { name: `${name}-db-secret`, namespace },
              spec: {
                vaultAuthRef: secretProvider.authRef,
                mount: secretProvider.mount,
                type: 'kv-v2',
                path: `${secretProvider.path}/${name}`,
                destination: {
                  create: true,
                  name: secretName,
                },
              },
            })
          );
          break;

        case 'openbao':
          resources.push(
            jsx('OpenBaoStaticSecret', {
              apiVersion: 'secrets.openbao.org/v1beta1',
              kind: 'OpenBaoStaticSecret',
              metadata: { name: `${name}-db-secret`, namespace },
              spec: {
                openbaoAuthRef: secretProvider.authRef,
                mount: secretProvider.mount,
                type: 'kv-v2',
                path: `${secretProvider.path}/${name}`,
                destination: {
                  create: true,
                  name: secretName,
                },
              },
            })
          );
          break;

        case 'kubernetes':
          // CNPG handles plain secrets automatically
          break;
      }
    }

    if (children) {
      resources.push(
        jsx(DatabaseContext.Provider, {
          value: connection,
          children,
        })
      );
    }
  }

  return resources;
}
