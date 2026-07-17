import { manifestOperator } from '@r8s/k8s-types';

/** CloudNativePG operator declaration */
export const cnpgOperator = (version = '1.22.5') =>
  manifestOperator(
    'cnpg',
    `https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-${version.split('.').slice(0, 2).join('.')}/releases/cnpg-${version}.yaml`,
    version,
    {
      description: 'CloudNativePG PostgreSQL operator',
      namespace: 'cnpg-system',
      crds: [
        'clusters.postgresql.cnpg.io',
        'poolers.postgresql.cnpg.io',
        'scheduledbackups.postgresql.cnpg.io',
      ],
    }
  );

/** NGINX Ingress Controller operator declaration */
export const nginxIngressOperator = (version = '1.15.1') =>
  manifestOperator(
    'nginx-ingress',
    `https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v${version}/deploy/static/provider/cloud/deploy.yaml`,
    version,
    {
      description: 'NGINX Ingress Controller',
      namespace: 'ingress-nginx',
    }
  );

/** Vault Secrets Operator declaration */
export const vaultSecretsOperator = (version = '0.5.0') =>
  manifestOperator(
    'vault-secrets-operator',
    `https://raw.githubusercontent.com/hashicorp/vault-secrets-operator/v${version}/config/default/deploy.yaml`,
    version,
    {
      description: 'HashiCorp Vault Secrets Operator',
      namespace: 'vault-secrets-operator',
      crds: ['vaultstaticsecrets.secrets.hashicorp.com', 'vaultauths.secrets.hashicorp.com'],
    }
  );
