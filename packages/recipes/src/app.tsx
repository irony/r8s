import { jsx } from '@r8s/core';
import { WebService, type SecretRef, type VaultSecretRef } from './web-service';
import { Ingress } from './ingress';
import type { TLSConfig } from '@r8s/k8s-types';

export interface AppProps {
  name: string;
  namespace?: string;
  image: string;
  port?: number;
  replicas?: number;
  host: string;
  tls?: TLSConfig;
  /** Plain environment variables (non-sensitive) */
  env?: Record<string, string>;
  /** Secrets from Kubernetes Secrets — safe by default */
  secrets?: Record<string, SecretRef | string>;
  /** Secrets from Vault — creates VaultStaticSecret objects */
  vault?: Record<string, VaultSecretRef>;
  resources?: {
    requests?: { cpu?: string; memory?: string };
    limits?: { cpu?: string; memory?: string };
  };
  children?: unknown;
}

/**
 * Simple application — Deployment + Service + Ingress.
 *
 * The simplest way to deploy an app to Kubernetes:
 * ```tsx
 * <App name="myapp" image="myapp/web:v1.2.3" host="myapp.example.com" />
 * ```
 *
 * With secrets from Kubernetes Secrets:
 * ```tsx
 * <App
 *   name="myapp"
 *   image="myapp/web:v1.2.3"
 *   host="myapp.example.com"
 *   env={{ LOG_LEVEL: 'info' }}
 *   secrets={{ DATABASE_URL: 'app-secrets' }}
 * />
 * ```
 *
 * With Vault secrets (auto-installs Vault Secrets Operator):
 * ```tsx
 * <App
 *   name="myapp"
 *   image="myapp/web:v1.2.3"
 *   host="myapp.example.com"
 *   vault={{ DATABASE_URL: { mount: 'kv', path: 'db/credentials' } }}
 * />
 * ```
 *
 * Compose with other components for more complex setups:
 * ```tsx
 * <>
 *   <Database name="myapp-db" storage="20Gi" />
 *   <App name="myapp" image="myapp/web:v1.2.3" host="myapp.example.com" tls={{ secretName: "myapp-tls", clusterIssuer: "letsencrypt" }}>
 *     <BackgroundWorker name="myapp-worker" image="myapp/worker:v1.2.3" />
 *   </App>
 * </>
 * ```
 */
export function App(props: AppProps) {
  const {
    name,
    namespace = 'default',
    image,
    port = 3000,
    replicas = 2,
    host,
    tls,
    env = {},
    secrets = {},
    vault = {},
    resources,
    children,
  } = props;

  const elements: ReturnType<typeof jsx>[] = [];

  elements.push(
    jsx(WebService, {
      name,
      namespace,
      image,
      port,
      replicas,
      env,
      secrets,
      vault,
      resources,
    })
  );

  elements.push(
    jsx(Ingress, {
      name: `${name}-ingress`,
      namespace,
      host,
      serviceName: name,
      servicePort: 80,
      tls,
    })
  );

  if (children) {
    elements.push(jsx('Fragment', { children }));
  }

  return elements;
}
