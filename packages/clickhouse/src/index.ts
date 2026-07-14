import { jsx } from '@r8s/core';
import { helmOperator } from '@r8s/k8s-types';

/** ClickHouse Operator declaration */
export const clickhouseOperator = (version = '0.23.0') =>
  helmOperator(
    'clickhouse-operator',
    'clickhouse-operator-helm',
    'https://docs.altinity.com/clickhouse-operator/',
    version,
    {
      description: 'ClickHouse Operator for Kubernetes by Altinity',
      namespace: 'clickhouse-operator-system',
      crds: [
        'clickhouseinstallations.clickhouse.altinity.com',
        'clickhouseinstallationtemplates.clickhouse.altinity.com',
        'clickhouseoperatorconfigurations.clickhouse.altinity.com',
      ],
    }
  );

export interface ClickHouseClusterProps {
  name: string;
  namespace?: string;
  cluster?: {
    layout?: {
      shardsCount?: number;
      replicasCount?: number;
    };
  };
  zookeeper?: {
    nodes?: Array<{ host: string; port?: number }>;
  };
  users?: Record<string, {
    password?: string;
    profile?: string;
    quota?: string;
    networks?: { ip?: string[] };
    grants?: { query?: string[] };
  }>;
  profiles?: Record<string, Record<string, string>>;
  quotas?: Record<string, Record<string, string>>;
  templates?: {
    podTemplates?: Array<{
      name: string;
      spec: {
        containers: Array<{
          name: string;
          image: string;
          resources?: {
            requests?: { cpu?: string; memory?: string };
            limits?: { cpu?: string; memory?: string };
          };
        }>;
      };
    }>;
    volumeClaimTemplates?: Array<{
      name: string;
      spec: {
        accessModes: string[];
        resources: {
          requests: { storage: string };
        };
      };
    }>;
  };
}

/**
 * ClickHouse cluster using ClickHouse Operator.
 *
 * @example
 * <ClickHouseCluster
 *   name="analytics"
 *   namespace="production"
 *   cluster={{
 *     layout: { shardsCount: 2, replicasCount: 2 }
 *   }}
 * />
 */
export function ClickHouseCluster(props: ClickHouseClusterProps) {
  const {
    name,
    namespace = 'default',
    cluster,
    zookeeper,
    users,
    profiles,
    quotas,
    templates,
  } = props;

  const chi = {
    apiVersion: 'clickhouse.altinity.com/v1',
    kind: 'ClickHouseInstallation',
    metadata: { name, namespace },
    spec: {
      configuration: {
        ...(cluster && {
          clusters: [{
            name: 'cluster',
            ...(cluster.layout && {
              layout: cluster.layout,
            }),
          }],
        }),
        ...(zookeeper && {
          zookeeper: {
            nodes: zookeeper.nodes,
          },
        }),
        ...(users && { users }),
        ...(profiles && { profiles }),
        ...(quotas && { quotas }),
      },
      ...(templates && {
        templates: {
          ...(templates.podTemplates && {
            podTemplates: templates.podTemplates,
          }),
          ...(templates.volumeClaimTemplates && {
            volumeClaimTemplates: templates.volumeClaimTemplates,
          }),
        },
      }),
    },
  };

  return jsx('ClickHouseInstallation', chi);
}
