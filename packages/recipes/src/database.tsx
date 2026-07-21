import { jsx, useContext, declareOperator } from '@r8s/core';
import { Cluster } from '@r8s/k8s-types';
import {
  DatabaseContext,
  SecretContext,
  OperatorContext,
  ClusterContext,
} from '@r8s/core/defaults';
import { cnpgOperator } from './operators';

export interface DatabaseProps {
  name: string;
  namespace?: string;
  storage?: string;
  /** Operator version override. If not set, reads from OperatorContext or uses default. */
  operatorVersion?: string;
  /** Password for the database. Required unless using Vault/OpenBao via SecretContext. */
  password?: string;
  children?: unknown;
}

/**
 * CloudNativePG PostgreSQL database.
 *
 * By default, creates a dedicated 3-instance HA cluster for this database.
 * When wrapped in a `<Cluster>` component, reuses the shared cluster's
 * connection info instead of creating a dedicated cluster.
 *
 * @example
 * // Dedicated cluster (default)
 * <Database name="app-db" storage="10Gi" />
 *
 * @example
 * // Shared cluster - reuses connection, does not provision a new database
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
    password,
    children,
  } = props;

  const clusterConfig = useContext(ClusterContext);
  const secretProvider = useContext(SecretContext);
  const sharedOperators = useContext(OperatorContext);
  const secretName = `${name}-db-credentials`;

  const resources: ReturnType<typeof jsx>[] = [];

  if (clusterConfig) {
    // Running inside a shared cluster - reuse connection info
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
          // Shared cluster path: we cannot rely on CNPG's bootstrap secret
          // handling because this Database does not own the CNPG Cluster object
          // (the surrounding <Cluster> component does). We must materialize a
          // Kubernetes Secret ourselves so consumers (e.g. WebService) can
          // resolve passwordSecret via DatabaseContext. A password is therefore
          // required here.
          if (!password) {
            throw new Error(
              `Database "${name}" requires a password prop when using Kubernetes secrets. ` +
                'Either provide a password or use Vault/OpenBao via SecretContext.'
            );
          }
          resources.push(
            jsx('Secret', {
              apiVersion: 'v1',
              kind: 'Secret',
              metadata: { name: secretName, namespace },
              stringData: {
                password,
                username: name,
                uri: `postgresql://${name}:${password}@${clusterConfig.host}:5432/${name}`,
              },
            })
          );
          break;

        default:
          if (!password) {
            throw new Error(
              `Database "${name}" requires a password prop. ` +
                'Either provide a password or use Vault/OpenBao via SecretContext.'
            );
          }
          resources.push(
            jsx('Secret', {
              apiVersion: 'v1',
              kind: 'Secret',
              metadata: { name: secretName, namespace },
              stringData: {
                password,
                username: name,
                uri: `postgresql://${name}:${password}@${clusterConfig.host}:5432/${name}`,
              },
            })
          );
      }
    } else {
      // No SecretContext - require explicit password
      if (!password) {
        throw new Error(
          `Database "${name}" requires a password prop. ` +
            'Either provide a password or use Vault/OpenBao via SecretContext.'
        );
      }
      resources.push(
        jsx('Secret', {
          apiVersion: 'v1',
          kind: 'Secret',
          metadata: { name: secretName, namespace },
          stringData: {
            password,
            username: name,
            uri: `postgresql://${name}:${password}@${clusterConfig.host}:5432/${name}`,
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
    const hasCNPG = sharedOperators.some((op) => op.name === 'cnpg');

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
      resources.push(declareOperator(cnpgOperator(operatorVersion)));
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
          // Dedicated cluster path: the CNPG Cluster resource created above
          // references the secret via spec.bootstrap.initdb.secret.name, and
          // CNPG will populate and rotate its contents automatically. No need
          // to emit a Secret ourselves — bringing one would actually conflict
          // with CNPG's ownership of that secret.
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
