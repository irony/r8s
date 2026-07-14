import { jsx, useContext, declareOperator } from '@r8s/core';
import { Cluster } from '@r8s/k8s-types';
import { DatabaseContext, SecretContext, OperatorContext } from '@r8s/core/defaults';
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
 * CloudNativePG PostgreSQL cluster with explicit operator dependency.
 *
 * Creates a 3-instance HA cluster and declares the CNPG operator as a dependency.
 * If the operator is already provided via OperatorContext, it won't be duplicated.
 *
 * Sets DatabaseContext so that child components (Keycloak, App, etc.) can
 * auto-wire their connections.
 *
 * @example
 * // Standalone - auto-declares CNPG operator
 * <Database name="myapp" storage="10Gi" />
 *
 * // With shared operators via context
 * <OperatorContext.Provider value={[cnpgOperator('1.22.0')]}>
 *   <Database name="app-db" storage="10Gi" />
 * </OperatorContext.Provider>
 *
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

  const secretProvider = useContext(SecretContext);
  const sharedOperators = useContext(OperatorContext);
  const secretName = `${name}-db-credentials`;

  // Check if CNPG operator is already provided via context
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
    user: name,
    passwordSecret: secretName,
    passwordKey: 'password',
    vendor: 'postgres' as const,
  };

  const resources: ReturnType<typeof jsx>[] = [];

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

  return resources;
}
