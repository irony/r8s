import { jsx } from '@r8s/core';
import { Cluster } from '@r8s/k8s-types';

export interface DatabaseProps {
  name: string;
  namespace?: string;
  storage?: string;
}

/**
 * Simple database using CloudNativePG.
 * 
 * Creates a 3-instance HA PostgreSQL cluster.
 * Credentials are auto-generated into a Secret.
 * 
 * @example
 * <Database name="myapp" storage="10Gi" />
 */
export function Database(props: DatabaseProps) {
  const {
    name,
    namespace = 'default',
    storage = '10Gi',
  } = props;

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
            name: `${name}-db-credentials`,
          },
        },
      },
      monitoring: {
        enabled: true,
      },
    },
  };

  return jsx('Cluster', cluster);
}
