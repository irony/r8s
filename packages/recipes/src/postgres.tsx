import { jsx } from '@r8s/core';
import { Cluster, Pooler, ScheduledBackup } from '@r8s/k8s-types';

export interface PostgresProps {
  name: string;
  namespace?: string;
  database?: string;
  user?: string;
  password?: string;
  passwordSecretName?: string;
  storage?: string;
  storageClass?: string;
  instances?: number;
  image?: string;
  resources?: {
    requests?: { memory?: string; cpu?: string };
    limits?: { memory?: string; cpu?: string };
  };
  enablePooler?: boolean;
  poolerInstances?: number;
  poolMode?: 'session' | 'transaction';
  enableBackup?: boolean;
  backupSchedule?: string;
  backupRetention?: string;
  postgresqlParameters?: Record<string, string>;
}

export function Postgres(props: PostgresProps) {
  const {
    name,
    namespace = 'default',
    database = 'app',
    user = 'app',
    password,
    passwordSecretName,
    storage = '10Gi',
    storageClass,
    instances = 3,
    image = 'ghcr.io/cloudnative-pg/postgresql:16.2',
    resources: resourceConfig = {
      requests: { memory: '512Mi', cpu: '500m' },
      limits: { memory: '1Gi', cpu: '1000m' },
    },
    enablePooler = false,
    poolerInstances = 2,
    poolMode = 'transaction',
    enableBackup = false,
    backupSchedule = '0 2 * * *',
    backupRetention = '7d',
    postgresqlParameters = {
      max_connections: '200',
      shared_buffers: '256MB',
    },
  } = props;

  // Use provided secret name or generate one
  const secretName = passwordSecretName || `${name}-credentials`;

  const cluster: Cluster = {
    apiVersion: 'postgresql.cnpg.io/v1',
    kind: 'Cluster',
    metadata: {
      name,
      namespace,
      labels: { app: name },
    },
    spec: {
      instances,
      imageName: image,
      storage: {
        size: storage,
        ...(storageClass && { storageClass }),
      },
      bootstrap: {
        initdb: {
          database,
          owner: user,
          secret: {
            name: secretName,
          },
        },
      },
      postgresql: {
        parameters: postgresqlParameters,
      },
      resources: resourceConfig,
      affinity: {
        enablePodAntiAffinity: true,
        topologyKey: 'kubernetes.io/hostname',
      },
      failoverSwitchoverDelay: 60,
      ...(enableBackup && {
        backup: {
          enabled: true,
          retentionPolicy: backupRetention,
          schedule: backupSchedule,
        },
      }),
      monitoring: {
        enabled: true,
      },
      replicationSlots: {
        highAvailability: {
          enabled: true,
        },
      },
    },
  };

  const outputResources: ReturnType<typeof jsx>[] = [jsx('Cluster', cluster)];

  // Add Secret if password is provided directly
  if (password && !passwordSecretName) {
    outputResources.push(
      jsx('Secret', {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name: secretName,
          namespace,
        },
        type: 'Opaque',
        stringData: {
          username: user,
          password,
        },
      })
    );
  }

  // Add Pooler for connection pooling
  if (enablePooler) {
    const pooler: Pooler = {
      apiVersion: 'postgresql.cnpg.io/v1',
      kind: 'Pooler',
      metadata: {
        name: `${name}-pooler`,
        namespace,
      },
      spec: {
        cluster: {
          name,
        },
        instances: poolerInstances,
        type: 'rw',
        pgbouncer: {
          poolMode,
          parameters: {
            max_client_conn: '10000',
            default_pool_size: '25',
          },
        },
      },
    };

    outputResources.push(jsx('Pooler', pooler));
  }

  // Add ScheduledBackup if enabled
  if (enableBackup) {
    const scheduledBackup: ScheduledBackup = {
      apiVersion: 'postgresql.cnpg.io/v1',
      kind: 'ScheduledBackup',
      metadata: {
        name: `${name}-backup`,
        namespace,
      },
      spec: {
        schedule: backupSchedule,
        backupOwnerReference: 'cluster',
        cluster: {
          name,
        },
      },
    };

    outputResources.push(jsx('ScheduledBackup', scheduledBackup));
  }

  return outputResources;
}
