import { jsx } from '@r8s/core';
import { ClusterIssuer, Certificate } from '@r8s/k8s-types';
import { manifestOperator } from '@r8s/k8s-types';

/** cert-manager operator declaration */
export const certManagerOperator = (version = '1.14.0') =>
  manifestOperator(
    'cert-manager',
    `https://github.com/cert-manager/cert-manager/releases/download/v${version}/cert-manager.yaml`,
    version,
    {
      description: 'cert-manager for TLS certificate automation',
      namespace: 'cert-manager',
      crds: [
        'certificates.cert-manager.io',
        'certificaterequests.cert-manager.io',
        'issuers.cert-manager.io',
        'clusterissuers.cert-manager.io',
        'challenges.acme.cert-manager.io',
        'orders.acme.cert-manager.io',
      ],
    }
  );

export interface LetsEncryptIssuerProps {
  name: string;
  email: string;
  server?: 'production' | 'staging';
  ingressClass?: string;
}

export function LetsEncryptIssuer(props: LetsEncryptIssuerProps) {
  const { name, email, server = 'production', ingressClass = 'nginx' } = props;

  const acmeServer =
    server === 'production'
      ? 'https://acme-v02.api.letsencrypt.org/directory'
      : 'https://acme-staging-v02.api.letsencrypt.org/directory';

  const issuer: ClusterIssuer = {
    apiVersion: 'cert-manager.io/v1',
    kind: 'ClusterIssuer',
    metadata: { name },
    spec: {
      acme: {
        server: acmeServer,
        email,
        privateKeySecretRef: { name: `${name}-account-key` },
        solvers: [
          {
            http01: {
              ingress: { class: ingressClass },
            },
          },
        ],
      },
    },
  };

  return jsx('ClusterIssuer', issuer);
}

export interface ManagedCertificateProps {
  name: string;
  namespace?: string;
  secretName: string;
  issuerName: string;
  dnsNames: string[];
  duration?: string;
  renewBefore?: string;
}

export function ManagedCertificate(props: ManagedCertificateProps) {
  const {
    name,
    namespace = 'default',
    secretName,
    issuerName,
    dnsNames,
    duration = '2160h', // 90 days
    renewBefore = '360h', // 15 days
  } = props;

  const certificate: Certificate = {
    apiVersion: 'cert-manager.io/v1',
    kind: 'Certificate',
    metadata: { name, namespace },
    spec: {
      secretName,
      issuerRef: {
        name: issuerName,
        kind: 'ClusterIssuer',
      },
      dnsNames,
      duration,
      renewBefore,
    },
  };

  return jsx('Certificate', certificate);
}
