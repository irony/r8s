// CloudNativePG (CNPG) CRDs
// https://cloudnative-pg.io/documentation/current/api_reference/

export interface Cluster {
  apiVersion: 'postgresql.cnpg.io/v1';
  kind: 'Cluster';
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
  };
  spec: {
    instances: number;
    description?: string;
    imageName?: string;
    postgresUID?: number;
    postgresGID?: number;
    storage?: {
      size: string;
      storageClass?: string;
    };
    superuserSecret?: {
      name: string;
    };
    bootstrap?: {
      initdb?: {
        database?: string;
        owner?: string;
        secret?: {
          name: string;
        };
      };
      recovery?: {
        source?: string;
      };
      pg_basebackup?: {
        source?: string;
      };
    };
    postgresql?: {
      parameters?: Record<string, string>;
    };
    resources?: {
      requests?: {
        cpu?: string;
        memory?: string;
      };
      limits?: {
        cpu?: string;
        memory?: string;
      };
    };
    affinity?: {
      enablePodAntiAffinity?: boolean;
      topologyKey?: string;
    };
    failoverSwitchoverDelay?: number;
    backup?: {
      enabled: boolean;
      retentionPolicy?: string;
      schedule?: string;
      barmanObjectStore?: {
        destinationPath?: string;
        endpointURL?: string;
        s3Credentials?: {
          accessKeyId?: {
            name: string;
            key: string;
          };
          secretAccessKey?: {
            name: string;
            key: string;
          };
        };
      };
    };
    monitoring?: {
      enabled?: boolean;
      customQueriesConfigMap?: {
        name: string;
        key: string;
      };
      customQueriesSecret?: {
        name: string;
        key: string;
      };
    };
    replicationSlots?: {
      highAvailability?: {
        enabled?: boolean;
      };
    };
    serviceAccountTemplate?: {
      metadata?: {
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
      };
    };
  };
}

export interface Pooler {
  apiVersion: 'postgresql.cnpg.io/v1';
  kind: 'Pooler';
  metadata: {
    name: string;
    namespace?: string;
  };
  spec: {
    cluster: {
      name: string;
    };
    instances?: number;
    type?: 'rw' | 'ro';
    pgbouncer?: {
      poolMode?: 'session' | 'transaction';
      parameters?: Record<string, string>;
    };
    serviceTemplate?: {
      metadata?: {
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
      };
      spec?: {
        type?: string;
      };
    };
  };
}

export interface ScheduledBackup {
  apiVersion: 'postgresql.cnpg.io/v1';
  kind: 'ScheduledBackup';
  metadata: {
    name: string;
    namespace?: string;
  };
  spec: {
    schedule: string;
    backupOwnerReference?: string;
    cluster: {
      name: string;
    };
    method?: 'barmanObjectStore' | 'volumeSnapshot';
  };
}
