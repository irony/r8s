import { jsx } from '@reactnetes/core';
import {
  VaultConnection,
  VaultAuth,
  VaultDynamicSecret,
  VaultStaticSecret,
} from '@reactnetes/k8s-types';

export interface VaultConnectionProps {
  name: string;
  namespace?: string;
  address: string;
  caCertSecretRef?: string;
  skipTLSVerify?: boolean;
}

export function VaultConnectionConfig(props: VaultConnectionProps) {
  const {
    name,
    namespace = 'default',
    address,
    caCertSecretRef,
    skipTLSVerify = false,
  } = props;

  const connection: VaultConnection = {
    apiVersion: 'secrets.hashicorp.com/v1beta1',
    kind: 'VaultConnection',
    metadata: { name, namespace },
    spec: {
      address,
      ...(caCertSecretRef && { caCertSecretRef }),
      skipTLSVerify,
    },
  };

  return jsx('VaultConnection', connection);
}

export interface VaultKubernetesAuthProps {
  name: string;
  namespace: string;
  vaultConnectionRef?: string;
  role: string;
  serviceAccount: string;
  mount?: string;
}

export function VaultKubernetesAuth(props: VaultKubernetesAuthProps) {
  const {
    name,
    namespace,
    vaultConnectionRef,
    role,
    serviceAccount,
    mount = 'kubernetes',
  } = props;

  const auth: VaultAuth = {
    apiVersion: 'secrets.hashicorp.com/v1beta1',
    kind: 'VaultAuth',
    metadata: { name, namespace },
    spec: {
      method: 'kubernetes',
      mount,
      kubernetes: { role, serviceAccount },
      ...(vaultConnectionRef && { vaultConnectionRef }),
    },
  };

  return jsx('VaultAuth', auth);
}

export interface VaultDatabaseSecretProps {
  name: string;
  namespace: string;
  vaultAuthRef: string;
  mount: string;
  path: string;
  secretName: string;
  rolloutRestartTarget?: { kind: string; name: string };
}

export function VaultDatabaseSecret(props: VaultDatabaseSecretProps) {
  const {
    name,
    namespace,
    vaultAuthRef,
    mount,
    path,
    secretName,
    rolloutRestartTarget,
  } = props;

  const dynamicSecret: VaultDynamicSecret = {
    apiVersion: 'secrets.hashicorp.com/v1beta1',
    kind: 'VaultDynamicSecret',
    metadata: { name, namespace },
    spec: {
      vaultAuthRef,
      mount,
      path,
      destination: {
        create: true,
        name: secretName,
      },
      ...(rolloutRestartTarget && {
        rolloutRestartTargets: [rolloutRestartTarget],
      }),
    },
  };

  return jsx('VaultDynamicSecret', dynamicSecret);
}

export interface VaultKVSecretProps {
  name: string;
  namespace: string;
  vaultAuthRef: string;
  mount: string;
  path: string;
  secretName: string;
  type?: 'kv-v1' | 'kv-v2';
  rolloutRestartTarget?: { kind: string; name: string };
}

export function VaultKVSecret(props: VaultKVSecretProps) {
  const {
    name,
    namespace,
    vaultAuthRef,
    mount,
    path,
    secretName,
    type = 'kv-v2',
    rolloutRestartTarget,
  } = props;

  const staticSecret: VaultStaticSecret = {
    apiVersion: 'secrets.hashicorp.com/v1beta1',
    kind: 'VaultStaticSecret',
    metadata: { name, namespace },
    spec: {
      vaultAuthRef,
      mount,
      type,
      path,
      destination: {
        create: true,
        name: secretName,
      },
      ...(rolloutRestartTarget && {
        rolloutRestartTargets: [rolloutRestartTarget],
      }),
    },
  };

  return jsx('VaultStaticSecret', staticSecret);
}
