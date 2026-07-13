// Vault / OpenBao CRDs
// https://developer.hashicorp.com/vault/docs/platform/k8s/vso/api-reference

export interface VaultAuth {
  apiVersion: 'secrets.hashicorp.com/v1beta1';
  kind: 'VaultAuth';
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
  };
  spec: {
    method: string;
    mount: string;
    kubernetes?: {
      role: string;
      serviceAccount: string;
    };
    vaultConnectionRef?: string;
  };
}

export interface VaultConnection {
  apiVersion: 'secrets.hashicorp.com/v1beta1';
  kind: 'VaultConnection';
  metadata: {
    name: string;
    namespace?: string;
  };
  spec: {
    address: string;
    caCertSecretRef?: string;
    tlsServerName?: string;
    skipTLSVerify?: boolean;
  };
}

export interface VaultDynamicSecret {
  apiVersion: 'secrets.hashicorp.com/v1beta1';
  kind: 'VaultDynamicSecret';
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    vaultAuthRef: string;
    mount: string;
    path: string;
    destination: {
      create: boolean;
      name: string;
    };
    rolloutRestartTargets?: Array<{
      kind: string;
      name: string;
    }>;
  };
}

export interface VaultStaticSecret {
  apiVersion: 'secrets.hashicorp.com/v1beta1';
  kind: 'VaultStaticSecret';
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    vaultAuthRef: string;
    mount: string;
    type: string;
    path: string;
    destination: {
      create: boolean;
      name: string;
    };
    rolloutRestartTargets?: Array<{
      kind: string;
      name: string;
    }>;
  };
}
